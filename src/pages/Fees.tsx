import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { feeApi } from '@/lib/api';
import { toast } from 'sonner';
import { DollarSign, Plus } from 'lucide-react';
import { format } from 'date-fns';

const Fees = () => {
  const [fees, setFees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    clubId: '',
    studentId: '',
  });

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    setIsLoading(true);
    try {
      // Since there's no "get all fees" endpoint, we'll show a message
      setFees([]);
    } catch (error) {
      toast.error('Failed to load fees');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await feeApi.record(
        parseInt(formData.clubId),
        parseInt(formData.studentId),
        {
          amount: parseFloat(formData.amount),
          purpose: formData.purpose,
        }
      );
      toast.success('Fee recorded successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadFees();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record fee');
    }
  };

  const handleStatusUpdate = async (feeId: number, status: string) => {
    try {
      await feeApi.updateStatus(feeId, status);
      toast.success('Fee status updated');
      loadFees();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      purpose: '',
      clubId: '',
      studentId: '',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PAID: 'bg-success/10 text-success',
      PENDING: 'bg-warning/10 text-warning',
      FAILED: 'bg-destructive/10 text-destructive',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-warning to-warning/70 shadow-md">
            <DollarSign className="h-7 w-7 text-warning-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-warning to-warning/70 bg-clip-text text-transparent">Fees</h1>
            <p className="text-muted-foreground text-lg">Track and manage club membership fees</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 bg-gradient-to-r from-warning to-warning/80 shadow-md hover:shadow-lg">
          <Plus className="h-4 w-4" />
          Record Fee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading fees...</div>
          ) : fees.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No fee records found. To view fees, query by student ID or club ID.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">${fee.amount}</TableCell>
                      <TableCell>{fee.purpose || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(fee.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(fee.status)}>
                          {fee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={fee.status}
                          onValueChange={(value) => handleStatusUpdate(fee.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record New Fee</DialogTitle>
            <DialogDescription>Create a fee record for a student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="50.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                placeholder="Annual membership fee"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubId">Club ID</Label>
              <Input
                id="clubId"
                type="number"
                placeholder="1"
                value={formData.clubId}
                onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                type="number"
                placeholder="1"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              />
            </div>
            <Button onClick={handleCreate} className="w-full">Record Fee</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fees;
