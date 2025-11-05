import { Button } from '@/components/ui/button';
import { Download, Database, FileArchive, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BackupExportButtons = () => {
  const handleBackup = () => {
    toast.info('Backup functionality will be implemented with backend support');
  };

  const handleExportData = () => {
    toast.info('Data export functionality will be implemented with backend support');
  };

  const handleDownloadBackup = () => {
    toast.info('Download backup functionality will be implemented with backend support');
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          Backup & Export
        </CardTitle>
        <CardDescription>
          Backup and export system data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Button
            variant="outline"
            onClick={handleBackup}
            className="gap-2 h-auto py-4 flex flex-col"
          >
            <Database className="h-5 w-5" />
            <span>Create Backup</span>
            <span className="text-xs text-muted-foreground">Backup all data</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
            className="gap-2 h-auto py-4 flex flex-col"
          >
            <FileArchive className="h-5 w-5" />
            <span>Export Data</span>
            <span className="text-xs text-muted-foreground">Export to JSON</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadBackup}
            className="gap-2 h-auto py-4 flex flex-col"
          >
            <Download className="h-5 w-5" />
            <span>Download Backup</span>
            <span className="text-xs text-muted-foreground">Download latest</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupExportButtons;

