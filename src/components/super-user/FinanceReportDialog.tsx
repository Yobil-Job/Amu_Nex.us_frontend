import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Download, Loader2, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface FinanceReportDialogProps {
  clubId: number;
  records: any[];
  events: any[];
  isOpen: boolean;
  onClose: () => void;
}

const FinanceReportDialog = ({ clubId, records, events, isOpen, onClose }: FinanceReportDialogProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState<'month' | 'event'>('month');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  // Generate available months for selection (last 12 months)
  const availableMonths = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date(),
    });
    return months.map((month) => ({
      value: format(month, 'yyyy-MM'),
      label: format(month, 'MMMM yyyy'),
    })).reverse();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setReportType('month');
      setSelectedMonth('');
      setSelectedEvent('');
      setReportData(null);
    }
  }, [isOpen]);

  const generateReport = () => {
    if (reportType === 'month' && !selectedMonth) {
      toast.error('Please select a month');
      return;
    }

    if (reportType === 'event' && !selectedEvent) {
      toast.error('Please select an event');
      return;
    }

    setIsGenerating(true);

    // Simulate report generation
    setTimeout(() => {
      let filteredRecords = [...records];

      if (reportType === 'month') {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = startOfMonth(new Date(year, month - 1));
        const endDate = endOfMonth(new Date(year, month - 1));

        filteredRecords = records.filter((record) => {
          const recordDate = new Date(record.date || record.createdAt);
          return recordDate >= startDate && recordDate <= endDate;
        });
      } else if (reportType === 'event') {
        const eventId = parseInt(selectedEvent);
        filteredRecords = records.filter((record) => record.eventId === eventId);
      }

      // Calculate report statistics
      const income = filteredRecords
        .filter((r) => r.type === 'income' || (r.amount && r.amount > 0))
        .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || '0') || 0), 0);

      const expenses = filteredRecords
        .filter((r) => r.type === 'expense' || (r.amount && r.amount < 0))
        .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || '0') || 0), 0);

      const balance = income - expenses;

      // Category breakdown
      const categoryBreakdown: Record<string, { income: number; expenses: number }> = {};
      filteredRecords.forEach((record) => {
        const category = record.category || 'OTHER';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { income: 0, expenses: 0 };
        }
        const amount = Math.abs(parseFloat(record.amount || '0') || 0);
        if (record.type === 'income' || (record.amount && record.amount > 0)) {
          categoryBreakdown[category].income += amount;
        } else {
          categoryBreakdown[category].expenses += amount;
        }
      });

      setReportData({
        type: reportType,
        period: reportType === 'month' ? format(new Date(selectedMonth + '-01'), 'MMMM yyyy') : events.find(e => e.id === parseInt(selectedEvent))?.title || 'Selected Event',
        records: filteredRecords,
        income,
        expenses,
        balance,
        categoryBreakdown,
        totalTransactions: filteredRecords.length,
      });

      setIsGenerating(false);
    }, 1000);
  };

  const handleExportPDF = async () => {
    if (!reportData) return;

    setIsGenerating(true);
    try {
      // Mock PDF export
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
    if (!reportData) return;

    setIsGenerating(true);
    try {
      // Create CSV content
      const headers = ['Date', 'Type', 'Category', 'Amount', 'Description', 'Receipt Number', 'Event'];
      const rows = reportData.records.map((record: any) => [
        record.date || record.createdAt ? format(new Date(record.date || record.createdAt), 'yyyy-MM-dd') : 'N/A',
        record.type === 'income' ? 'Income' : 'Expense',
        record.category || 'N/A',
        Math.abs(parseFloat(record.amount || '0')).toFixed(2),
        record.description || 'N/A',
        record.receiptNumber || 'N/A',
        record.eventId ? events.find((e) => e.id === record.eventId)?.title || 'N/A' : 'N/A',
      ]);

      const csvContent = [
        ['Finance Report', reportData.period],
        ['Generated', new Date().toLocaleDateString()],
        ['Total Income', reportData.income.toFixed(2)],
        ['Total Expenses', reportData.expenses.toFixed(2)],
        ['Balance', reportData.balance.toFixed(2)],
        [],
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].map((row) => (Array.isArray(row) ? row.join(',') : row)).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `finance_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Finance Report
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Generate a detailed finance report by month or event
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Type Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Report Type</Label>
              <Select value={reportType} onValueChange={(value) => {
                setReportType(value as 'month' | 'event');
                setSelectedMonth('');
                setSelectedEvent('');
                setReportData(null);
              }}>
                <SelectTrigger className="glass-card border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">By Month</SelectItem>
                  <SelectItem value="event">By Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === 'month' && (
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Select Month
                </Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="glass-card border-primary/20">
                    <SelectValue placeholder="Select a month" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === 'event' && (
              <div className="space-y-2">
                <Label className="text-white">Select Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="glass-card border-primary/20">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={generateReport}
              disabled={isGenerating || (reportType === 'month' && !selectedMonth) || (reportType === 'event' && !selectedEvent)}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>

          {/* Report Results */}
          {reportData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="glass-card border-success/20">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(reportData.income)}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-destructive/20">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-destructive">{formatCurrency(reportData.expenses)}</p>
                  </CardContent>
                </Card>
                <Card className={`glass-card ${reportData.balance >= 0 ? 'border-primary/20' : 'border-warning/20'}`}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className={`text-2xl font-bold ${reportData.balance >= 0 ? 'text-white' : 'text-warning'}`}>
                      {formatCurrency(Math.abs(reportData.balance))}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-white mb-3">Category Breakdown</h4>
                  <div className="space-y-2">
                    {Object.entries(reportData.categoryBreakdown).map(([category, data]: [string, any]) => (
                      <div key={category} className="flex items-center justify-between glass-card p-2 rounded border border-primary/10">
                        <span className="text-sm text-white">{category.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-4">
                          {data.income > 0 && (
                            <span className="text-sm text-success">Income: {formatCurrency(data.income)}</span>
                          )}
                          {data.expenses > 0 && (
                            <span className="text-sm text-destructive">Expenses: {formatCurrency(data.expenses)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Count */}
              <div className="text-center text-muted-foreground">
                <p>Total Transactions: {reportData.totalTransactions}</p>
                <p className="text-xs">Period: {reportData.period}</p>
              </div>
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

export default FinanceReportDialog;

