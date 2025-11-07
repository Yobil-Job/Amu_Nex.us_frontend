import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, Download, Plus, FileText, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/admin/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface MeetingSchedulerProps {
  clubId: number;
  members: any[];
}

// Client-side storage for meetings (mock)
const STORAGE_KEY = 'meetings';

export const saveMeeting = (meeting: any) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allMeetings = stored ? JSON.parse(stored) : [];
    
    if (meeting.id) {
      // Update existing
      const updated = allMeetings.map((m: any) =>
        m.id === meeting.id ? { ...meeting, updatedAt: new Date().toISOString() } : m
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } else {
      // Create new
      allMeetings.push({
        ...meeting,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allMeetings));
    }
  } catch (error) {
    console.error('Failed to save meeting:', error);
  }
};

export const loadMeetings = (clubId: number): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const allMeetings = JSON.parse(stored);
    return allMeetings
      .filter((m: any) => m.clubId === clubId)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.scheduledDate || 0);
        const dateB = new Date(b.scheduledDate || 0);
        return dateA.getTime() - dateB.getTime();
      });
  } catch {
    return [];
  }
};

export const deleteMeeting = (meetingId: number) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const allMeetings = JSON.parse(stored);
    const filtered = allMeetings.filter((m: any) => m.id !== meetingId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete meeting:', error);
  }
};

const MeetingScheduler = ({ clubId, members }: MeetingSchedulerProps) => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    attendees: [] as number[],
    agenda: '',
    notes: '',
  });

  useEffect(() => {
    loadMeetingsData();
  }, [clubId]);

  const loadMeetingsData = () => {
    const loadedMeetings = loadMeetings(clubId);
    setMeetings(loadedMeetings);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      saveMeeting({
        ...(selectedMeeting ? { id: selectedMeeting.id } : {}),
        clubId,
        createdBy: user?.id,
        createdByName: `${user?.firstname} ${user?.lastname}`,
        ...formData,
        scheduledDateTime: scheduledDateTime.toISOString(),
      });

      toast.success(`Meeting ${selectedMeeting ? 'updated' : 'scheduled'} successfully`);
      resetForm();
      setFormOpen(false);
      loadMeetingsData();
    } catch (error: any) {
      toast.error('Failed to save meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (meeting: any) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    try {
      deleteMeeting(meeting.id);
      toast.success('Meeting deleted successfully');
      loadMeetingsData();
    } catch (error: any) {
      toast.error('Failed to delete meeting');
    }
  };

  const handleExportNotes = (meeting: any) => {
    try {
      const notesContent = `Meeting Notes: ${meeting.title}
Date: ${format(new Date(meeting.scheduledDateTime), 'MMMM dd, yyyy')}
Time: ${format(new Date(meeting.scheduledDateTime), 'HH:mm')}
Location: ${meeting.location || 'N/A'}

Attendees:
${meeting.attendees?.map((id: number) => {
  const member = members.find((m) => m.id === id);
  return member ? `- ${member.firstname} ${member.lastname}` : '';
}).join('\n') || 'N/A'}

Agenda:
${meeting.agenda || 'N/A'}

Notes:
${meeting.notes || 'No notes recorded'}

Created by: ${meeting.createdByName || 'Unknown'}
Created on: ${meeting.createdAt ? format(new Date(meeting.createdAt), 'MMMM dd, yyyy') : 'N/A'}
`;

      const blob = new Blob([notesContent], { type: 'text/plain' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `meeting_notes_${meeting.id}_${format(new Date(meeting.scheduledDateTime), 'yyyy-MM-dd')}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Meeting notes exported successfully');
    } catch (error) {
      toast.error('Failed to export meeting notes');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduledDate: '',
      scheduledTime: '',
      location: '',
      attendees: [],
      agenda: '',
      notes: '',
    });
    setSelectedMeeting(null);
  };

  const handleEdit = (meeting: any) => {
    setSelectedMeeting(meeting);
    const date = new Date(meeting.scheduledDateTime);
    setFormData({
      title: meeting.title || '',
      description: meeting.description || '',
      scheduledDate: format(date, 'yyyy-MM-dd'),
      scheduledTime: format(date, 'HH:mm'),
      location: meeting.location || '',
      attendees: meeting.attendees || [],
      agenda: meeting.agenda || '',
      notes: meeting.notes || '',
    });
    setFormOpen(true);
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

  const upcomingMeetings = meetings.filter((m) => isFuture(new Date(m.scheduledDateTime)));
  const pastMeetings = meetings.filter((m) => isPast(new Date(m.scheduledDateTime)));

  return (
    <>
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Meeting Scheduler
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Schedule meetings with club members and export meeting notes
              </p>
            </div>
            <Button onClick={() => {
              resetForm();
              setFormOpen(true);
            }} className="gap-2">
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Upcoming Meetings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upcoming Meetings</h3>
            {upcomingMeetings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No Upcoming Meetings"
                description="Schedule your first meeting"
              />
            ) : (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <Card key={meeting.id} className="glass-card border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-white">{meeting.title}</h4>
                            <Badge className="bg-success/10 text-success border-success/30">
                              Upcoming
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(meeting.scheduledDateTime)}</span>
                            </div>
                            {meeting.location && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{meeting.location}</span>
                              </div>
                            )}
                            {meeting.attendees && meeting.attendees.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{meeting.attendees.length} attendees</span>
                              </div>
                            )}
                          </div>
                          {meeting.description && (
                            <p className="text-sm text-white mt-2">{meeting.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(meeting)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(meeting)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Meetings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Past Meetings</h3>
            {pastMeetings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No Past Meetings"
                description="Past meetings will appear here"
              />
            ) : (
              <div className="space-y-4">
                {pastMeetings.map((meeting) => (
                  <Card key={meeting.id} className="glass-card border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-white">{meeting.title}</h4>
                            <Badge className="bg-muted text-muted-foreground">
                              Past
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(meeting.scheduledDateTime)}</span>
                            </div>
                            {meeting.location && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{meeting.location}</span>
                              </div>
                            )}
                          </div>
                          {meeting.notes && (
                            <div className="mt-3 glass-card p-3 rounded border border-primary/10">
                              <p className="text-xs text-muted-foreground mb-1">Meeting Notes:</p>
                              <p className="text-sm text-white whitespace-pre-wrap">{meeting.notes}</p>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportNotes(meeting)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export Notes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meeting Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => {
        setFormOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="glass-card border-primary/20 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {selectedMeeting ? 'Edit Meeting' : 'Schedule Meeting'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedMeeting ? 'Update meeting details' : 'Create a new meeting'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-title" className="text-white">
                Meeting Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="meeting-title"
                placeholder="Enter meeting title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="glass-card border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-description" className="text-white">
                Description
              </Label>
              <Textarea
                id="meeting-description"
                placeholder="Meeting description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="glass-card border-primary/20 min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-date" className="text-white">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="glass-card border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-time" className="text-white">
                  Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting-time"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="glass-card border-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-location" className="text-white">
                Location
              </Label>
              <Input
                id="meeting-location"
                placeholder="Meeting location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="glass-card border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-attendees" className="text-white">
                Attendees
              </Label>
              <div className="glass-card p-4 rounded border border-primary/20 max-h-48 overflow-y-auto">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members available</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`attendee-${member.id}`}
                          checked={formData.attendees.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                attendees: [...formData.attendees, member.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                attendees: formData.attendees.filter((id) => id !== member.id),
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor={`attendee-${member.id}`}
                          className="text-sm text-white cursor-pointer"
                        >
                          {member.firstname} {member.lastname} ({member.email})
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {formData.attendees.length} member(s)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-agenda" className="text-white">
                Agenda
              </Label>
              <Textarea
                id="meeting-agenda"
                placeholder="Meeting agenda..."
                value={formData.agenda}
                onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                className="glass-card border-primary/20 min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-notes" className="text-white">
                Notes
              </Label>
              <Textarea
                id="meeting-notes"
                placeholder="Meeting notes (can be added after meeting)..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="glass-card border-primary/20 min-h-[100px]"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title || !formData.scheduledDate || !formData.scheduledTime}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  {selectedMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MeetingScheduler;

