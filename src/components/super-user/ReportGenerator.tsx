import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface ReportGeneratorProps {
  clubId: number;
  clubName: string;
  onGenerate: (reportType: string, dateRange: { start: Date; end: Date }) => void;
  isGenerating?: boolean;
}

const REPORT_TYPES = [
  { value: 'COMPREHENSIVE', label: 'Comprehensive Report', description: 'All data (members, finances, events)' },
  { value: 'MEMBERSHIP', label: 'Membership Report', description: 'Member growth and statistics' },
  { value: 'FINANCIAL', label: 'Financial Report', description: 'Income, expenses, and financial performance' },
  { value: 'EVENTS', label: 'Events Report', description: 'Event participation and statistics' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'LAST_MONTH', label: 'Last Month' },
  { value: 'LAST_3_MONTHS', label: 'Last 3 Months' },
  { value: 'LAST_6_MONTHS', label: 'Last 6 Months' },
  { value: 'LAST_YEAR', label: 'Last Year' },
  { value: 'CUSTOM', label: 'Custom Range' },
];

const ReportGenerator = ({ clubId, clubName, onGenerate, isGenerating = false }: ReportGeneratorProps) => {
  const [reportType, setReportType] = useState('COMPREHENSIVE');
  const [dateRangeOption, setDateRangeOption] = useState('LAST_6_MONTHS');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    // Set default custom dates (last 6 months)
    const endDate = new Date();
    const startDate = subMonths(endDate, 6);
    setCustomStartDate(format(startDate, 'yyyy-MM-dd'));
    setCustomEndDate(format(endDate, 'yyyy-MM-dd'));
  }, []);

  const getDateRange = (): { start: Date; end: Date } => {
    const endDate = new Date();

    if (dateRangeOption === 'CUSTOM') {
      return {
        start: customStartDate ? new Date(customStartDate) : subMonths(endDate, 6),
        end: customEndDate ? new Date(customEndDate) : endDate,
      };
    }

    let startDate: Date;
    switch (dateRangeOption) {
      case 'LAST_MONTH':
        startDate = startOfMonth(subMonths(endDate, 1));
        break;
      case 'LAST_3_MONTHS':
        startDate = startOfMonth(subMonths(endDate, 2));
        break;
      case 'LAST_6_MONTHS':
        startDate = startOfMonth(subMonths(endDate, 5));
        break;
      case 'LAST_YEAR':
        startDate = startOfMonth(subMonths(endDate, 11));
        break;
      default:
        startDate = startOfMonth(subMonths(endDate, 5));
    }

    return {
      start: startDate,
      end: endOfMonth(endDate),
    };
  };

  const handleGenerate = () => {
    const dateRange = getDateRange();

    if (dateRange.start > dateRange.end) {
      toast.error('Start date must be before end date');
      return;
    }

    onGenerate(reportType, dateRange);
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Generate Report
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate detailed reports for {clubName}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label className="text-white">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="glass-card border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-semibold">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <Select value={dateRangeOption} onValueChange={setDateRangeOption}>
              <SelectTrigger className="glass-card border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {dateRangeOption === 'CUSTOM' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-white">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="glass-card border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-white">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="glass-card border-primary/20"
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>
          )}

          {/* Date Range Preview */}
          <div className="glass-card p-3 rounded border border-primary/10">
            <p className="text-xs text-muted-foreground mb-1">Date Range:</p>
            <p className="text-sm text-white">
              {format(getDateRange().start, 'MMM dd, yyyy')} - {format(getDateRange().end, 'MMM dd, yyyy')}
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (dateRangeOption === 'CUSTOM' && (!customStartDate || !customEndDate))}
            className="w-full gap-2 purple-gold-gradient"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;

