import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonsProps {
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  disabled?: boolean;
}

const ExportButtons = ({ onExportExcel, onExportPDF, disabled }: ExportButtonsProps) => {
  const handleExportExcel = () => {
    if (onExportExcel) {
      onExportExcel();
    } else {
      // Mock export functionality
      toast.info('Excel export functionality will be implemented with backend support');
    }
  };

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      // Mock export functionality
      toast.info('PDF export functionality will be implemented with backend support');
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExportExcel}
        disabled={disabled}
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export Excel
      </Button>
      <Button
        variant="outline"
        onClick={handleExportPDF}
        disabled={disabled}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Export PDF
      </Button>
    </div>
  );
};

export default ExportButtons;

