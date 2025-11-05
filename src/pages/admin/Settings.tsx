import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Shield, HardDrive } from 'lucide-react';
import SettingsForm from '@/components/admin/SettingsForm';
import BackupExportButtons from '@/components/admin/BackupExportButtons';
import RoleAssignmentDialog from '@/components/admin/RoleAssignmentDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';

const AdminSettings = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await studentApi.getAll().catch(() => ({ _embedded: { studentResponseDtoList: [] } }));
      const studentsList = extractCollection<any>(response);
      setStudents(studentsList);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const openRoleAssignment = (student: any) => {
    setSelectedStudent(student);
    setIsRoleDialogOpen(true);
  };

  const handleRoleAssignmentSuccess = () => {
    loadStudents();
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <SettingsIcon className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              System Configuration
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage system settings, roles, and configurations
            </p>
          </div>
        </div>
      </div>

      <div className="luxury-divider"></div>

      {/* Settings Tabs */}
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Role Assignment
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <HardDrive className="h-4 w-4" />
            Backup & Export
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <SettingsForm />
        </TabsContent>

        {/* Role Assignment Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Role Assignment
              </CardTitle>
              <CardDescription>
                Assign roles to students (Club Admin, Administrator, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No students available</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
                    {students.slice(0, 50).map((student) => (
                      <div
                        key={student.id}
                        className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                            {(student.firstname?.[0] || '') + (student.lastname?.[0] || '')}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {student.firstname} {student.lastname}
                            </div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRoleAssignment(student)}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Assign Role
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <RoleAssignmentDialog
            student={selectedStudent}
            isOpen={isRoleDialogOpen}
            onClose={() => setIsRoleDialogOpen(false)}
            onSuccess={handleRoleAssignmentSuccess}
          />
        </TabsContent>

        {/* Backup & Export Tab */}
        <TabsContent value="backup" className="space-y-6">
          <BackupExportButtons />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;

