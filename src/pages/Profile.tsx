import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { studentApi, clubApi, eventApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User, Pencil, Building2, Calendar, Shield, Mail, Phone, MapPin, GraduationCap, Clock, HelpCircle, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PasswordChange from '@/components/student/PasswordChange';
import RolesView from '@/components/student/RolesView';
import { isStudent } from '@/lib/roles';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userClubs, setUserClubs] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [userAuthorities, setUserAuthorities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    gender: '',
    yearOfStay: '',
    department: '',
    password: '', // Optional password field for update
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showPasswordVisibility, setShowPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    loadProfileData();
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;
    
    // Show user context data immediately (no loading spinner)
    if (user) {
      setProfile(user);
        setFormData({
          firstname: user.firstname || '',
          lastname: user.lastname || '',
          email: user.email || '',
          gender: user.gender || '',
          yearOfStay: user.yearOfStay || '',
          department: user.department || '', // Ensure department is properly set, not email
          password: '', // Password never pre-filled
        });
    }

    setIsLoading(true);
    
    // Load additional data in background (non-blocking)
    try {
      // Load user profile first (fastest), then clubs, events, authorities in parallel
      const profileRes = await studentApi.getMe().catch(() => null);
      
      // Update profile if we got more data from API
      if (profileRes) {
        console.log('📊 Profile API response:', JSON.stringify(profileRes, null, 2));
        
        // Try multiple response structures
        let profileData: any = null;
        
        // Strategy 1: Direct student object
        if (profileRes.id || profileRes.email) {
          profileData = profileRes;
        }
        // Strategy 2: Nested student object
        else if (profileRes.student) {
          profileData = profileRes.student;
        }
        // Strategy 3: Principal structure
        else if (profileRes.principal) {
          profileData = profileRes.principal.student || profileRes.principal;
        }
        // Strategy 4: Use response as-is
        else {
          profileData = profileRes;
        }
        
        console.log('✅ Extracted profile data:', profileData);
        
        if (profileData) {
          setProfile(profileData);
          setFormData({
            firstname: profileData.firstname || user.firstname || '',
            lastname: profileData.lastname || user.lastname || '',
            email: profileData.email || user.email || '',
            gender: profileData.gender || user.gender || '',
            yearOfStay: profileData.yearOfStay || user.yearOfStay || '',
            department: profileData.department || '', // Only use department, never email
            password: '', // Password never pre-filled
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      // Don't show error toast, we have user context data
    }

    // Load clubs, events, authorities in parallel (non-blocking UI)
    Promise.all([
      studentApi.getClubs(user.id).catch(() => ({ _embedded: { responseClubDtoList: [] } })),
      studentApi.getEvents(user.id).catch(() => ({ _embedded: { eventList: [] } })),
      authorityApi.getByStudent(user.id).catch(() => ({ _embedded: { authorityList: [] } })),
    ]).then(([clubsRes, eventsRes, authoritiesRes]) => {
      const clubsList = extractCollection<any>(clubsRes);
      const eventsList = extractCollection<any>(eventsRes);
      const authoritiesList = extractCollection<any>(authoritiesRes);

      setUserClubs(clubsList);
      setUserEvents(eventsList);
      setUserAuthorities(authoritiesList);
      setIsLoading(false);
    }).catch((error) => {
      console.error('Failed to load profile collections:', error);
      setIsLoading(false);
    });
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    };
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    // Validate required fields
    if (!formData.firstname || formData.firstname.length < 2 || formData.firstname.length > 30) {
      toast.error('First name must be between 2 and 30 characters');
      return;
    }

    if (!formData.lastname || formData.lastname.length < 2 || formData.lastname.length > 30) {
      toast.error('Last name must be between 2 and 30 characters');
      return;
    }

    if (formData.department && (formData.department.length < 3 || formData.department.length > 50)) {
      toast.error('Department must be between 3 and 50 characters');
      return;
    }

    // Validate password change if password fields are shown
    if (showPasswordFields && isStudent(user?.role)) {
      if (!passwordData.currentPassword) {
        toast.error('Please enter your current password');
        return;
      }

      if (!passwordData.newPassword) {
        toast.error('Please enter a new password');
        return;
      }

      const passwordValidation = validatePassword(passwordData.newPassword);
      if (!passwordValidation.isValid) {
        toast.error('New password does not meet requirements. Please check all validation rules.');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (passwordData.currentPassword === passwordData.newPassword) {
        toast.error('New password must be different from current password');
        return;
      }
    }

    try {
      // Build update payload matching StudentRequestDtoFull
      const updatePayload: any = {
        firstname: formData.firstname,
        lastname: formData.lastname,
      };

      // Only include optional fields if they have values
      if (formData.gender) {
        // Gender enum values: MALE, FEMALE, PREFER_NOT_TO_MENTION
        updatePayload.gender = formData.gender;
      }
      if (formData.department) {
        updatePayload.department = formData.department;
      }
      if (formData.yearOfStay) {
        updatePayload.yearOfStay = formData.yearOfStay;
      }

      // Include new password if password change is being performed
      if (showPasswordFields && isStudent(user?.role) && passwordData.newPassword) {
        updatePayload.password = passwordData.newPassword;
      }

      await studentApi.update(user.id, updatePayload);
      toast.success('Profile updated successfully');
      setIsEditDialogOpen(false);
      // Reset password fields
      setFormData({ ...formData, password: '' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordFields(false);
      loadProfileData();
      // Refresh user context if needed
      window.location.reload(); // Simple refresh to update context
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const getInitials = (firstname?: string, lastname?: string, email?: string) => {
    if (firstname && lastname) {
      return `${firstname[0]}${lastname[0]}`.toUpperCase();
    }
    if (firstname) {
      return firstname[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getRoleColor = (role?: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      ADMIN: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      STUDENT: 'bg-success/10 text-success',
    };
    return colors[role || 'STUDENT'] || colors.STUDENT;
  };

  // Don't show loading spinner if we have user data - show content immediately
  // Only show spinner if we have no user data at all
  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-fade-in">
      {/* Profile Header */}
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
                {getInitials(profile?.firstname, profile?.lastname, profile?.email || user?.email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">
                  {profile?.firstname && profile?.lastname 
                    ? `${profile.firstname} ${profile.lastname}`
                    : profile?.email || user?.email || 'User'}
                </h1>
                <Badge className={getRoleColor(user?.role)}>
                  {user?.role || 'STUDENT'}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile?.email || user?.email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{profile?.email || user?.email}</span>
                  </div>
                ) : null}
                {profile?.department && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{profile.department}</span>
                  </div>
                )}
                {profile?.yearOfStay && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Year {profile.yearOfStay}</span>
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={() => setIsEditDialogOpen(true)}
              className="gap-2 bg-gradient-primary shadow-colored-primary"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className={`grid w-full ${isStudent(user?.role) ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clubs">My Clubs ({userClubs.length})</TabsTrigger>
          <TabsTrigger value="events">My Events ({userEvents.length})</TabsTrigger>
          <TabsTrigger value="authorities">
            {isStudent(user?.role) ? 'My Roles' : 'Authorities'} ({userAuthorities.length})
          </TabsTrigger>
          {isStudent(user?.role) && (
            <TabsTrigger value="security">Security</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">
                    {profile?.firstname && profile?.lastname 
                      ? `${profile.firstname} ${profile.lastname}`
                      : 'Not set'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{profile?.email || user?.email || 'Not set'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Gender</Label>
                  <p className="font-medium">{profile?.gender || 'Not set'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Year of Stay</Label>
                  <p className="font-medium">{profile?.yearOfStay || 'Not set'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{profile?.department || 'Not set'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Role</Label>
                  <Badge className={getRoleColor(user?.role)}>
                    {user?.role || 'STUDENT'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="font-medium font-mono">{user?.id || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Account Status</Label>
                  <Badge className="bg-success/10 text-success">Active</Badge>
                </div>
                {isStudent(user?.role) && userAuthorities.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-muted-foreground">Active Roles</Label>
                    <div className="flex flex-wrap gap-2">
                      {userAuthorities
                        .filter((auth) => {
                          if (!auth.endDate) return true;
                          return new Date(auth.endDate) > new Date();
                        })
                        .map((auth) => (
                          <Badge key={auth.id} variant="secondary" className="text-xs">
                            {auth.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clubs Joined</p>
                    <p className="text-3xl font-bold text-primary">{userClubs.length}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-success/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Events Attended</p>
                    <p className="text-3xl font-bold text-success">{userEvents.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-success/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Authority Roles</p>
                    <p className="text-3xl font-bold text-accent">{userAuthorities.length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clubs Tab */}
        <TabsContent value="clubs" className="space-y-4">
          {userClubs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">You haven't joined any clubs yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {userClubs.map((club) => (
                <Card key={club.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{club.title || club.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{club.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">{club.club_Type}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {userEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">You haven't attended any events yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {event.startAt && format(new Date(event.startAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Authorities/Roles Tab */}
        <TabsContent value="authorities" className="space-y-4">
          {isStudent(user?.role) ? (
            <RolesView authorities={userAuthorities} isLoading={isLoading} />
          ) : (
            userAuthorities.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You don't have any authority roles assigned.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Authority Roles</CardTitle>
                  <CardDescription>Your leadership positions in clubs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userAuthorities.map((authority) => (
                        <TableRow key={authority.id}>
                          <TableCell className="font-medium">{authority.name}</TableCell>
                          <TableCell>{authority.club?.title || authority.club?.name || 'N/A'}</TableCell>
                          <TableCell>
                            {authority.startDate && format(new Date(authority.startDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {authority.endDate && format(new Date(authority.endDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {authority.endDate && new Date(authority.endDate) > new Date() ? 'Active' : 'Expired'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>

        {/* Security Tab (Student Only) */}
        {isStudent(user?.role) && (
          <TabsContent value="security" className="space-y-4">
            <PasswordChange />
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  value={formData.firstname}
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  value={formData.lastname}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            {isStudent(user?.role) && (
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Computer Science"
                  minLength={3}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.department?.length || 0}/50 characters (min 3)
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_MENTION">Prefer Not to Mention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearOfStay">Year of Stay</Label>
                <Select value={formData.yearOfStay} onValueChange={(value) => setFormData({ ...formData, yearOfStay: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First_Year">First Year</SelectItem>
                    <SelectItem value="Second_Year">Second Year</SelectItem>
                    <SelectItem value="Third_Year">Third Year</SelectItem>
                    <SelectItem value="Fourth_Year">Fourth Year</SelectItem>
                    <SelectItem value="Fivth_Year">Fifth Year</SelectItem>
                    <SelectItem value="Sixth_Year">Sixth Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!isStudent(user?.role) && (
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Computer Science"
                  minLength={3}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.department?.length || 0}/50 characters (min 3)
                </p>
              </div>
            )}
            
            {/* Password Change Section for Students */}
            {isStudent(user?.role) && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <Label className="text-base font-semibold">Change Password</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPasswordFields(!showPasswordFields);
                      if (!showPasswordFields) {
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }
                    }}
                  >
                    {showPasswordFields ? 'Cancel' : 'Change Password'}
                  </Button>
                </div>
                
                {showPasswordFields && (() => {
                  const passwordValidation = passwordData.newPassword ? validatePassword(passwordData.newPassword) : null;
                  
                  return (
                    <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                      {/* Current Password */}
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswordVisibility.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            placeholder="Enter your current password"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswordVisibility({ ...showPasswordVisibility, current: !showPasswordVisibility.current })}
                          >
                            {showPasswordVisibility.current ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswordVisibility.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            placeholder="Enter your new password"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswordVisibility({ ...showPasswordVisibility, new: !showPasswordVisibility.new })}
                          >
                            {showPasswordVisibility.new ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {passwordValidation && (
                          <div className="space-y-1 mt-2 text-xs">
                            <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-success' : 'text-muted-foreground'}`}>
                              {passwordValidation.minLength ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>At least 8 characters</span>
                            </div>
                            <div className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-success' : 'text-muted-foreground'}`}>
                              {passwordValidation.hasUpperCase ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>One uppercase letter</span>
                            </div>
                            <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-success' : 'text-muted-foreground'}`}>
                              {passwordValidation.hasLowerCase ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>One lowercase letter</span>
                            </div>
                            <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-success' : 'text-muted-foreground'}`}>
                              {passwordValidation.hasNumber ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>One number</span>
                            </div>
                            <div className={`flex items-center gap-2 ${passwordValidation.hasSpecialChar ? 'text-success' : 'text-muted-foreground'}`}>
                              {passwordValidation.hasSpecialChar ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>One special character</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswordVisibility.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            placeholder="Confirm your new password"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswordVisibility({ ...showPasswordVisibility, confirm: !showPasswordVisibility.confirm })}
                          >
                            {showPasswordVisibility.confirm ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {passwordData.confirmPassword && (
                          <div className="flex items-center gap-2 text-xs mt-1">
                            {passwordData.newPassword === passwordData.confirmPassword ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-success" />
                                <span className="text-success">Passwords match</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 text-destructive" />
                                <span className="text-destructive">Passwords do not match</span>
                              </>
                            )}
                          </div>
                                                 )}
                       </div>
                     </div>
                   );
                 })()}
              </div>
            )}
             <Button onClick={handleUpdateProfile} className="w-full mt-4 bg-gradient-primary shadow-colored-primary">
               Save Changes
             </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default Profile;

