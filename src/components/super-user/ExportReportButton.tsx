import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface ExportReportButtonProps {
  reportData: any;
  reportType: string;
  clubName: string;
  dateRange: { start: Date; end: Date };
  isExporting?: boolean;
}

const ExportReportButton = ({
  reportData,
  reportType,
  clubName,
  dateRange,
  isExporting = false,
}: ExportReportButtonProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const exportToExcel = () => {
    try {
      // Create CSV content
      const headers: string[] = [];
      const rows: string[][] = [];

      // Header
      headers.push('Club Report');
      headers.push(`${clubName} - ${reportType}`);
      headers.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`);
      headers.push(`Date Range: ${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`);
      rows.push(headers);
      rows.push([]);

      // Report Data
      if (reportType === 'COMPREHENSIVE' || reportType === 'MEMBERSHIP') {
        rows.push(['MEMBERSHIP STATISTICS']);
        rows.push(['Total Members', reportData.totalMembers?.toString() || '0']);
        rows.push(['New Members (Period)', reportData.newMembers?.toString() || '0']);
        rows.push(['Membership Growth Rate', `${reportData.membershipGrowthRate?.toFixed(2) || '0'}%`]);
        rows.push([]);
      }

      if (reportType === 'COMPREHENSIVE' || reportType === 'FINANCIAL') {
        rows.push(['FINANCIAL STATISTICS']);
        rows.push(['Total Income', formatCurrency(reportData.totalIncome || 0)]);
        rows.push(['Total Expenses', formatCurrency(reportData.totalExpenses || 0)]);
        rows.push(['Net Profit/Loss', formatCurrency(reportData.netProfit || 0)]);
        rows.push(['Total Fees Collected', formatCurrency(reportData.totalFeesCollected || 0)]);
        rows.push([]);
      }

      if (reportType === 'COMPREHENSIVE' || reportType === 'EVENTS') {
        rows.push(['EVENT STATISTICS']);
        rows.push(['Total Events', reportData.totalEvents?.toString() || '0']);
        rows.push(['Upcoming Events', reportData.upcomingEvents?.toString() || '0']);
        rows.push(['Past Events', reportData.pastEvents?.toString() || '0']);
        rows.push(['Total Participants', reportData.totalParticipants?.toString() || '0']);
        rows.push(['Average Participants per Event', reportData.avgParticipants?.toFixed(2) || '0']);
        rows.push([]);
      }

      // Monthly Breakdown (if comprehensive)
      if (reportType === 'COMPREHENSIVE' && reportData.monthlyBreakdown) {
        rows.push(['MONTHLY BREAKDOWN']);
        rows.push(['Month', 'New Members', 'Income', 'Expenses', 'Events', 'Participants']);
        reportData.monthlyBreakdown.forEach((month: any) => {
          rows.push([
            month.month,
            month.newMembers?.toString() || '0',
            formatCurrency(month.income || 0),
            formatCurrency(month.expenses || 0),
            month.events?.toString() || '0',
            month.participants?.toString() || '0',
          ]);
        });
      }

      // Convert to CSV
      const csvContent = rows
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `club_report_${reportType.toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report exported to Excel (CSV) successfully');
    } catch (error) {
      toast.error('Failed to export report to Excel');
    }
  };

  const exportToPDF = () => {
    try {
      // Mock PDF export
      toast.info('PDF export functionality will be available soon');
      
      // In a real implementation, you would use a library like jsPDF or pdfkit
      // For now, we'll just show a success message after a delay
      setTimeout(() => {
        toast.success('PDF report exported successfully (mock)');
      }, 1000);
    } catch (error) {
      toast.error('Failed to export report to PDF');
    }
  };

  if (!reportData) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export Report
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-primary/20 bg-background/95 backdrop-blur-md">
        <DropdownMenuItem
          onClick={exportToExcel}
          className="cursor-pointer text-white focus:text-white focus:bg-primary/20"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2 text-white" />
          <span className="text-white">Export as Excel (CSV)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={exportToPDF}
          className="cursor-pointer text-white focus:text-white focus:bg-primary/20"
        >
          <FileText className="h-4 w-4 mr-2 text-white" />
          <span className="text-white">Export as PDF (Mock)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportReportButton;

