import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ExportMembersButtonProps {
  members: any[];
  authorities?: any[];
}

const ExportMembersButton = ({ members, authorities = [] }: ExportMembersButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  // Get member roles from authorities
  const getMemberRoles = (memberId: number) => {
    const memberAuthorities = authorities.filter((auth: any) => {
      const studentId = auth.student?.id || auth.studentId;
      return studentId === memberId;
    });
    if (memberAuthorities.length === 0) return 'Student';
    return memberAuthorities.map((auth: any) => auth.name || 'Student').join(', ');
  };

  const exportToExcel = async () => {
    if (members.length === 0) {
      toast.error('No members to export');
      return;
    }

    setIsExporting(true);
    try {
      // Mock Excel export - In production, use a library like xlsx
      const headers = ['Name', 'Email', 'Department', 'Year', 'Roles', 'Joined Date'];
      const rows = members.map((member) => {
        const roles = getMemberRoles(member.id);
        const joinedDate = member.createdAt 
          ? new Date(member.createdAt).toLocaleDateString()
          : 'N/A';
        
        return [
          `${member.firstname || ''} ${member.lastname || ''}`,
          member.email || 'N/A',
          member.department || 'N/A',
          member.yearOfStay || 'N/A',
          roles,
          joinedDate,
        ];
      });

      // Create CSV content (simpler than Excel for mock)
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `club_members_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Members exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export members');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (members.length === 0) {
      toast.error('No members to export');
      return;
    }

    setIsExporting(true);
    try {
      // Mock PDF export - In production, use a library like jsPDF or html2pdf
      toast.info('PDF export functionality will be available soon');
      
      // For now, just show a success message
      setTimeout(() => {
        toast.success('PDF export simulation complete');
        setIsExporting(false);
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export members');
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isExporting || members.length === 0}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export Members
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-primary/20 bg-background/95 backdrop-blur-md">
        <DropdownMenuItem
          onClick={exportToExcel}
          disabled={isExporting}
          className="cursor-pointer text-white focus:text-white focus:bg-primary/20"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2 text-white" />
          <span className="text-white">Export as Excel (.csv)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={exportToPDF}
          disabled={isExporting}
          className="cursor-pointer text-white focus:text-white focus:bg-primary/20"
        >
          <FileText className="h-4 w-4 mr-2 text-white" />
          <span className="text-white">Export as PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportMembersButton;

