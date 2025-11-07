import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, Users, DollarSign, MessageSquare, Calendar, Clock, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EventReportDialogProps {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventReportDialog = ({ event, isOpen, onClose }: EventReportDialogProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (event && isOpen) {
      // Generate mock report data
      // In production, this would come from backend API
      generateMockReport();
    }
  }, [event, isOpen]);

  const generateMockReport = () => {
    if (!event) return;

    // Mock data - In production, fetch from backend
    const mockData = {
      attendance: {
        totalRegistered: event.participationCount || 0,
        totalAttended: Math.floor((event.participationCount || 0) * 0.85), // 85% attendance rate
        attendanceRate: 85,
        checkInRecords: [
          { name: 'John Doe', checkInTime: new Date().toISOString(), status: 'Present' },
          { name: 'Jane Smith', checkInTime: new Date().toISOString(), status: 'Present' },
          { name: 'Bob Johnson', checkInTime: new Date().toISOString(), status: 'Present' },
        ],
      },
      budget: {
        totalBudget: 5000,
        totalSpent: 4200,
        remaining: 800,
        categories: [
          { name: 'Venue', allocated: 2000, spent: 1800 },
          { name: 'Catering', allocated: 1500, spent: 1500 },
          { name: 'Materials', allocated: 1000, spent: 600 },
          { name: 'Marketing', allocated: 500, spent: 300 },
        ],
      },
      feedback: {
        totalResponses: 25,
        averageRating: 4.2,
        ratings: {
          5: 12,
          4: 8,
          3: 3,
          2: 1,
          1: 1,
        },
        comments: [
          'Great event! Very well organized.',
          'Enjoyed the activities and networking.',
          'Could use better catering options.',
          'Looking forward to the next one!',
        ],
      },
    };

    setReportData(mockData);
  };

  const handleExportPDF = async () => {
    if (!event || !reportData) return;

    setIsGenerating(true);
    try {
      // Mock PDF export - In production, use a library like jsPDF
      toast.info('PDF export functionality will be available soon');
      setTimeout(() => {
        toast.success('PDF report exported successfully (mock)');
        setIsGenerating(false);
      }, 1000);
    } catch (error) {
      toast.error('Failed to export PDF');
      setIsGenerating(false);
    }
  };

  const handleExportExcel = async () => {
    if (!event || !reportData) return;

    setIsGenerating(true);
    try {
      // Mock Excel export - Create CSV
      const csvContent = [
        ['Event Report', event.title || 'Untitled Event'],
        ['Date', event.startAt ? format(parseISO(event.startAt), 'MMM dd, yyyy') : 'N/A'],
        [],
        ['Attendance Summary'],
        ['Total Registered', reportData.attendance.totalRegistered],
        ['Total Attended', reportData.attendance.totalAttended],
        ['Attendance Rate', `${reportData.attendance.attendanceRate}%`],
        [],
        ['Budget Summary'],
        ['Total Budget', reportData.budget.totalBudget],
        ['Total Spent', reportData.budget.totalSpent],
        ['Remaining', reportData.budget.remaining],
        [],
        ['Feedback Summary'],
        ['Total Responses', reportData.feedback.totalResponses],
        ['Average Rating', reportData.feedback.averageRating],
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `event_report_${event.id}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setIsGenerating(false);
    }
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

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Event Report
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Detailed report for {event.title || 'Untitled Event'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event Information */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg text-white mb-3">Event Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Start:</span>
                  <span className="text-white">{formatDate(event.startAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">End:</span>
                  <span className="text-white">{formatDate(event.endAt)}</span>
                </div>
                {event.latitude && event.longitude && (
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="text-white">
                      {parseFloat(event.latitude).toFixed(4)}, {parseFloat(event.longitude).toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {reportData ? (
            <>
              {/* Attendance Summary */}
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg text-white mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Attendance Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Registered</p>
                      <p className="text-2xl font-bold text-white">{reportData.attendance.totalRegistered}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Attended</p>
                      <p className="text-2xl font-bold text-white">{reportData.attendance.totalAttended}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                      <p className="text-2xl font-bold text-primary">{reportData.attendance.attendanceRate}%</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white">Check-in Records (Sample)</p>
                    {reportData.attendance.checkInRecords.slice(0, 5).map((record: any, index: number) => (
                      <div key={index} className="flex items-center justify-between glass-card p-2 rounded border border-primary/10">
                        <span className="text-sm text-white">{record.name}</span>
                        <Badge variant="outline" className="text-xs border-success/30 text-success">
                          {record.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Budget Summary */}
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg text-white mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Budget Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-2xl font-bold text-white">${reportData.budget.totalBudget}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold text-accent">${reportData.budget.totalSpent}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold text-success">${reportData.budget.remaining}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white">Budget by Category</p>
                    {reportData.budget.categories.map((category: any, index: number) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white">{category.name}</span>
                          <span className="text-muted-foreground">
                            ${category.spent} / ${category.allocated}
                          </span>
                        </div>
                        <div className="w-full bg-primary/10 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(category.spent / category.allocated) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Summary */}
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Feedback Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Responses</p>
                      <p className="text-2xl font-bold text-white">{reportData.feedback.totalResponses}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                      <p className="text-2xl font-bold text-primary">{reportData.feedback.averageRating}/5</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white">Rating Distribution</p>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm text-white w-8">{rating}★</span>
                        <div className="flex-1 bg-primary/10 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(reportData.feedback.ratings[rating] / reportData.feedback.totalResponses) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">
                          {reportData.feedback.ratings[rating]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-white">Sample Comments</p>
                    {reportData.feedback.comments.map((comment: string, index: number) => (
                      <div key={index} className="glass-card p-3 rounded border border-primary/10">
                        <p className="text-sm text-white">{comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Generating report...</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Close
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={isGenerating || !reportData}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export as Excel
              </>
            )}
          </Button>
          <Button
            variant="default"
            onClick={handleExportPDF}
            disabled={isGenerating || !reportData}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Export as PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventReportDialog;

