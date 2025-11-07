import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Lightbulb, Send, User, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/admin/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SuggestionBoxProps {
  clubId: number;
  members: any[];
}

// Client-side storage for suggestions (mock)
const STORAGE_KEY = 'suggestions';

export const saveSuggestion = (suggestion: any) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allSuggestions = stored ? JSON.parse(stored) : [];
    allSuggestions.push({
      ...suggestion,
      id: Date.now(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSuggestions));
  } catch (error) {
    console.error('Failed to save suggestion:', error);
  }
};

export const loadSuggestions = (clubId: number): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const allSuggestions = JSON.parse(stored);
    return allSuggestions
      .filter((s: any) => s.clubId === clubId)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
  } catch {
    return [];
  }
};

export const updateSuggestionStatus = (suggestionId: number, status: 'APPROVED' | 'REJECTED', response?: string) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const allSuggestions = JSON.parse(stored);
    const updated = allSuggestions.map((s: any) =>
      s.id === suggestionId
        ? { ...s, status, response, respondedAt: new Date().toISOString() }
        : s
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update suggestion:', error);
  }
};

const SuggestionBox = ({ clubId, members }: SuggestionBoxProps) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    submittedBy: '',
  });

  useEffect(() => {
    loadSuggestions();
  }, [clubId]);

  const loadSuggestions = () => {
    const loadedSuggestions = loadSuggestions(clubId);
    setSuggestions(loadedSuggestions);
  };

  const filteredSuggestions = suggestions.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  const handleSubmitSuggestion = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      saveSuggestion({
        clubId,
        submittedBy: formData.submittedBy || `${user?.firstname} ${user?.lastname}` || 'Anonymous',
        submittedById: user?.id || null,
        ...formData,
      });

      toast.success('Suggestion submitted successfully');
      setFormData({ title: '', description: '', category: 'GENERAL', submittedBy: '' });
      setFormOpen(false);
      loadSuggestions();
    } catch (error: any) {
      toast.error('Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespond = (suggestion: any, status: 'APPROVED' | 'REJECTED') => {
    setSelectedSuggestion(suggestion);
    setResponse('');
    setResponseDialogOpen(true);
  };

  const handleConfirmResponse = () => {
    if (!selectedSuggestion) return;

    updateSuggestionStatus(selectedSuggestion.id, selectedSuggestion.status, response);
    toast.success(`Suggestion ${selectedSuggestion.status.toLowerCase()}`);
    setResponseDialogOpen(false);
    setSelectedSuggestion(null);
    setResponse('');
    loadSuggestions();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <>
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Suggestion Box
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Members can submit ideas and suggestions (visible only to authorities)
              </p>
            </div>
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Send className="h-4 w-4" />
              Submit Suggestion
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="mb-4">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="glass-card border-primary/20 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Suggestions List */}
          {filteredSuggestions.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="No Suggestions"
              description={
                statusFilter === 'all'
                  ? 'No suggestions have been submitted yet'
                  : `No ${statusFilter.toLowerCase()} suggestions`
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="glass-card border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{suggestion.title}</h3>
                          {getStatusBadge(suggestion.status)}
                          <Badge variant="outline" className="text-xs">
                            {suggestion.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <User className="h-4 w-4" />
                          <span>{suggestion.submittedBy}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{formatDate(suggestion.createdAt)}</span>
                        </div>
                        <p className="text-sm text-white whitespace-pre-wrap">
                          {suggestion.description}
                        </p>
                        {suggestion.response && (
                          <div className="mt-3 glass-card p-3 rounded border border-primary/10">
                            <p className="text-xs text-muted-foreground mb-1">
                              Response ({formatDate(suggestion.respondedAt)}):
                            </p>
                            <p className="text-sm text-white">{suggestion.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {suggestion.status === 'PENDING' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSuggestion({ ...suggestion, status: 'APPROVED' });
                            setResponse('');
                            setResponseDialogOpen(true);
                          }}
                          className="gap-2 text-success hover:text-success hover:bg-success/10"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSuggestion({ ...suggestion, status: 'REJECTED' });
                            setResponse('');
                            setResponseDialogOpen(true);
                          }}
                          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Suggestion Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="glass-card border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Submit Suggestion
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Share your ideas and suggestions with club authorities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suggestion-title" className="text-white">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="suggestion-title"
                placeholder="Enter suggestion title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="glass-card border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestion-category" className="text-white">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="glass-card border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="EVENTS">Events</SelectItem>
                  <SelectItem value="FACILITIES">Facilities</SelectItem>
                  <SelectItem value="ACTIVITIES">Activities</SelectItem>
                  <SelectItem value="IMPROVEMENTS">Improvements</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestion-description" className="text-white">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="suggestion-description"
                placeholder="Describe your suggestion..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="glass-card border-primary/20 min-h-[150px]"
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestion-submittedBy" className="text-white">
                Your Name (Optional)
              </Label>
              <Input
                id="suggestion-submittedBy"
                placeholder="Leave empty to submit anonymously"
                value={formData.submittedBy}
                onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })}
                className="glass-card border-primary/20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSuggestion}
              disabled={isSubmitting || !formData.title || !formData.description}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Suggestion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-xl neon-text text-white">
              {selectedSuggestion?.status === 'APPROVED' ? 'Approve' : 'Reject'} Suggestion
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a response to the suggestion (optional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedSuggestion && (
              <div className="glass-card p-3 rounded border border-primary/10">
                <p className="text-sm font-semibold text-white mb-1">{selectedSuggestion.title}</p>
                <p className="text-xs text-muted-foreground">{selectedSuggestion.description}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="response" className="text-white">
                Response (Optional)
              </Label>
              <Textarea
                id="response"
                placeholder="Add your response..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="glass-card border-primary/20 min-h-[100px]"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmResponse}
              className={`gap-2 ${
                selectedSuggestion?.status === 'APPROVED'
                  ? 'bg-success hover:bg-success/90'
                  : 'bg-destructive hover:bg-destructive/90'
              }`}
            >
              {selectedSuggestion?.status === 'APPROVED' ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SuggestionBox;

