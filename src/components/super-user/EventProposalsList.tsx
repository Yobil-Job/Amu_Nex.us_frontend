import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/admin/EmptyState';
import { toast } from 'sonner';
import { eventApi } from '@/lib/api';

interface EventProposalsListProps {
  proposals: any[];
  isLoading: boolean;
  onApprove: (proposal: any) => void;
  onReject: (proposal: any) => void;
}

// Mock proposals stored in localStorage (client-side only)
// In production, this would come from backend API
const STORAGE_KEY = 'event_proposals';

// Load proposals from localStorage (mock)
export const loadEventProposals = (clubId: number): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const allProposals = JSON.parse(stored);
    return allProposals.filter((p: any) => p.clubId === clubId && p.status === 'PENDING');
  } catch {
    return [];
  }
};

// Save proposals to localStorage (mock)
export const saveEventProposal = (proposal: any) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allProposals = stored ? JSON.parse(stored) : [];
    allProposals.push({ ...proposal, id: Date.now(), status: 'PENDING', createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProposals));
  } catch (error) {
    console.error('Failed to save proposal:', error);
  }
};

// Update proposal status (mock)
export const updateProposalStatus = (proposalId: number, status: 'APPROVED' | 'REJECTED') => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const allProposals = JSON.parse(stored);
    const updated = allProposals.map((p: any) => 
      p.id === proposalId ? { ...p, status, updatedAt: new Date().toISOString() } : p
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update proposal:', error);
  }
};

const EventProposalsList = ({ proposals, isLoading, onApprove, onReject }: EventProposalsListProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      try {
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy HH:mm');
      } catch {
        return dateString;
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <EmptyState
            icon={Calendar}
            title="No Event Proposals"
            description="No pending event proposals from club members."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          Pending Event Proposals ({proposals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="glass-card p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-primary">
                      <Calendar className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-white mb-1">
                        {proposal.title || 'Untitled Event Proposal'}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Proposed by: {proposal.proposedBy?.name || proposal.proposedByName || 'Club Member'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {proposal.description || 'No description provided'}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Start: {formatDate(proposal.startAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>End: {formatDate(proposal.endAt)}</span>
                        </div>
                        {proposal.latitude && proposal.longitude && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>Location: {parseFloat(proposal.latitude).toFixed(4)}, {parseFloat(proposal.longitude).toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                      
                      {proposal.reason && (
                        <div className="glass-card p-3 rounded border border-primary/10 mb-3">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Proposal Reason:</p>
                          <p className="text-sm text-white">{proposal.reason}</p>
                        </div>
                      )}
                      
                      <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                        Proposed {proposal.createdAt ? formatDate(proposal.createdAt) : 'Recently'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove(proposal)}
                    className="gap-2 bg-success hover:bg-success/90"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(proposal)}
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventProposalsList;

