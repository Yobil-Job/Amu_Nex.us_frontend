import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { authorityApi } from '@/lib/api';
import { toast } from 'sonner';
import { Shield, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const Authorities = () => {
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    clubId: '',
    studentId: '',
    clubAdminId: '',
  });

  useEffect(() => {
    loadAuthorities();
  }, []);

  const loadAuthorities = async () => {
    setIsLoading(true);
    try {
      // Since there's no "get all authorities" endpoint, show empty state
      setAuthorities([]);
    } catch (error) {
      toast.error('Failed to load authorities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await authorityApi.create(parseInt(formData.clubAdminId), {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        clubId: parseInt(formData.clubId),
        studentId: parseInt(formData.studentId),
      });
      toast.success('Authority created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadAuthorities();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create authority');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      clubId: '',
      studentId: '',
      clubAdminId: '',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">Authorities</h1>
            <p className="text-muted-foreground text-lg">Manage club leadership and authority roles</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} variant="gradient" className="gap-2 shadow-colored-primary">
          <Plus className="h-4 w-4" />
          Create Authority
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authority Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading authorities...</div>
          ) : authorities.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No authority records found. To view authorities, query by student ID or club ID.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authorities.map((authority) => (
                    <TableRow key={authority.id}>
                      <TableCell className="font-medium">{authority.name}</TableCell>
                      <TableCell>{format(new Date(authority.startDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(authority.endDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
            <DialogTitle>Create Authority</DialogTitle>
            <DialogDescription>Assign an authority role to a student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                placeholder="President, Vice President, etc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="clubAdminId">Club Admin ID</Label>
              <Input
                id="clubAdminId"
                type="number"
                placeholder="1"
                value={formData.clubAdminId}
                onChange={(e) => setFormData({ ...formData, clubAdminId: e.target.value })}
              />
            </div>
            <Button onClick={handleCreate} className="w-full">Create Authority</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Authorities;
