import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, RefreshCw, Search, X, FileText, Clock, List, Grid, Building2 } from 'lucide-react';
import { clubApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import ResourcesList from '@/components/super-user/ResourcesList';
import ResourceForm, { loadResources, deleteResource as deleteResourceFromStorage } from '@/components/super-user/ResourceForm';
import LendResourceDialog from '@/components/super-user/LendResourceDialog';
import ReturnResourceDialog from '@/components/super-user/ReturnResourceDialog';
import ResourceRequestDialog, { loadResourceRequests } from '@/components/super-user/ResourceRequestDialog';
import ResourceHistory, { loadResourceHistory as loadHistory } from '@/components/super-user/ResourceHistory';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EmptyState from '@/components/admin/EmptyState';
import { AlertTriangle } from 'lucide-react';

const SuperUserResources = () => {
  const { user } = useAuth();
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [allResources, setAllResources] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resources' | 'requests'>('resources');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [lendDialogOpen, setLendDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [resourceHistory, setResourceHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadUserClub();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadData();
    }
  }, [selectedClub?.id]);

  // Load user's authorized clubs (using shared utility - same approach as club admin)
  const loadUserClub = async () => {
    if (!user?.id) return;
    
    try {
      const { loadAuthorizedClubsForUser } = await import('@/lib/superUserUtils');
      const clubs = await loadAuthorizedClubsForUser(user.id);

      if (clubs.length === 0) {
        toast.info('You are not assigned as an authority for any club yet. Please contact your club admin.');
        setIsLoading(false);
        return;
      }

      // Use the first club (if multiple, can add selector later)
      setSelectedClub(clubs[0]);
    } catch (error: any) {
      console.error('Failed to load authorized clubs:', error);
      toast.error('Failed to load your club information');
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    if (!selectedClub?.id) return;

    setIsLoading(true);
    try {
      // Load members (for lending resources)
      // SUPER_USER cannot access /clubs/{id}/get-members (restricted to SUPER_ADMIN and ADMIN)
      // For resource lending, we'll use a mock member list or allow manual entry
      try {
        const membersRes = await clubApi.getMembers(selectedClub.id).catch((err: any) => {
          if (import.meta.env.DEV) {
            console.warn('⚠️ [SuperUserResources] Cannot fetch members - permission denied:', err);
          }
          return [];
        });
        // getMembers returns List<StudentResponseDto> directly (not HATEOAS) if successful
        const membersList = Array.isArray(membersRes) ? membersRes : extractCollection<any>(membersRes) || [];
        setMembers(membersList);
      } catch (err) {
        // If we can't load members, set empty array - lending dialog can allow manual entry
        setMembers([]);
        if (import.meta.env.DEV) {
          console.info('ℹ️ [SuperUserResources] Members list unavailable. Resource lending may require manual member entry.');
        }
      }

      // Load resources from localStorage (mock - backend endpoints don't exist)
      const resourcesList = loadResources(selectedClub.id);
      setAllResources(resourcesList);
      setResources(resourcesList);

      // Load resource requests from localStorage (mock - backend endpoints don't exist)
      const requestsList = loadResourceRequests(selectedClub.id);
      setRequests(requestsList);
    } catch (error: any) {
      console.error('Failed to load resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter resources
  const filteredResources = useMemo(() => {
    let filtered = [...allResources];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((resource) => {
        const name = (resource.name || '').toLowerCase();
        const description = (resource.description || '').toLowerCase();
        const category = (resource.category || '').toLowerCase();
        const location = (resource.location || '').toLowerCase();
        return (
          name.includes(query) ||
          description.includes(query) ||
          category.includes(query) ||
          location.includes(query)
        );
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((resource) => resource.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((resource) => {
        if (statusFilter === 'AVAILABLE') {
          return resource.status === 'AVAILABLE' && !resource.lentTo;
        } else if (statusFilter === 'LENT') {
          return resource.lentTo || resource.status === 'LENT';
        } else if (statusFilter === 'MAINTENANCE') {
          return resource.status === 'MAINTENANCE';
        }
        return true;
      });
    }

    return filtered;
  }, [allResources, searchQuery, categoryFilter, statusFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    allResources.forEach((resource) => {
      if (resource.category) {
        categorySet.add(resource.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [allResources]);

  // Statistics
  const stats = useMemo(() => {
    const total = allResources.length;
    const available = allResources.filter((r) => r.status === 'AVAILABLE' && !r.lentTo).length;
    const lent = allResources.filter((r) => r.lentTo || r.status === 'LENT').length;
    const maintenance = allResources.filter((r) => r.status === 'MAINTENANCE').length;

    return { total, available, lent, maintenance };
  }, [allResources]);

  const handleAdd = () => {
    setSelectedResource(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (resource: any) => {
    setSelectedResource(resource);
    setFormDialogOpen(true);
  };

  const handleDelete = (resource: any) => {
    setSelectedResource(resource);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedResource?.id) return;

    try {
      deleteResourceFromStorage(selectedResource.id);
      toast.success('Resource deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedResource(null);
      loadData();
    } catch (error: any) {
      toast.error('Failed to delete resource');
    }
  };

  const handleLend = (resource: any) => {
    setSelectedResource(resource);
    setLendDialogOpen(true);
  };

  const handleReturn = (resource: any) => {
    setSelectedResource(resource);
    setReturnDialogOpen(true);
  };

  const handleViewHistory = (resource: any) => {
    setSelectedResource(resource);
    const history = loadHistory(resource.id);
    setResourceHistory(history);
    setHistoryDialogOpen(true);
  };

  const handleSuccess = () => {
    loadData();
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Resources' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Package className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Resource Management
              {requests.length > 0 && (
                <Badge className="bg-accent text-accent-foreground">
                  {requests.length} Requests
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Manage resources for ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Manage club resources and equipment'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedClub && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestDialogOpen(true)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Submit Request
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleAdd}
                className="gap-2 purple-gold-gradient"
              >
                <Plus className="h-4 w-4" />
                Add Resource
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading || !selectedClub}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="luxury-divider"></div>

      {!selectedClub ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
            <p className="text-muted-foreground">
              You are not assigned as an authority for any club yet. Please contact your club admin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Resources</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-success/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{stats.available}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-warning/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{stats.lent}</div>
                <div className="text-sm text-muted-foreground">Lent Out</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-destructive/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{stats.maintenance}</div>
                <div className="text-sm text-muted-foreground">Maintenance</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'resources' | 'requests')}>
            <TabsList className="glass-card border-primary/20">
              <TabsTrigger value="resources" className="gap-2">
                <Package className="h-4 w-4" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-2">
                <FileText className="h-4 w-4" />
                Requests
                {requests.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {requests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resources" className="mt-6 space-y-6">
              {/* Filters */}
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search resources..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-10 glass-card border-primary/20"
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setSearchQuery('')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {categories.length > 0 && (
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="glass-card border-primary/20 px-3 py-2 rounded-lg bg-background text-white text-sm"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      )}

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="glass-card border-primary/20 px-3 py-2 rounded-lg bg-background text-white text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="LENT">Lent Out</option>
                        <option value="MAINTENANCE">Maintenance</option>
                      </select>

                      <div className="flex items-center gap-1 border border-primary/20 rounded-lg p-1">
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="h-8 px-3"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className="h-8 px-3"
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resources List */}
              <ResourcesList
                resources={filteredResources}
                isLoading={isLoading}
                onLend={handleLend}
                onReturn={handleReturn}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
                viewMode={viewMode}
              />
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    Resource Requests ({requests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {requests.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No Resource Requests"
                      description="No pending resource requests. Submit a request to purchase or maintain resources."
                    />
                  ) : (
                    <div className="space-y-4">
                      {requests.map((request) => (
                        <Card key={request.id} className="glass-card border-primary/20">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg text-white">
                                    {request.title || 'Resource Request'}
                                  </h3>
                                  <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                                    {request.type === 'PURCHASE' ? 'Purchase' : 'Maintenance'}
                                  </Badge>
                                  {request.urgency && (
                                    <Badge
                                      className={`text-xs ${
                                        request.urgency === 'URGENT'
                                          ? 'bg-destructive/10 text-destructive'
                                          : request.urgency === 'HIGH'
                                          ? 'bg-warning/10 text-warning'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {request.urgency}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {request.description || 'No description'}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>Requested by: {request.requestedByName || 'Club Member'}</span>
                                  {request.estimatedCost && (
                                    <span>Estimated: {parseFloat(request.estimatedCost).toFixed(2)} ETB</span>
                                  )}
                                  {request.resourceName && (
                                    <span>Resource: {request.resourceName}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modals */}
      <ResourceForm
        resource={selectedResource}
        clubId={selectedClub?.id || 0}
        isOpen={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setSelectedResource(null);
        }}
        onSuccess={handleSuccess}
      />

      <LendResourceDialog
        resource={selectedResource}
        members={members}
        isOpen={lendDialogOpen}
        onClose={() => {
          setLendDialogOpen(false);
          setSelectedResource(null);
        }}
        onSuccess={handleSuccess}
      />

      <ReturnResourceDialog
        resource={selectedResource}
        isOpen={returnDialogOpen}
        onClose={() => {
          setReturnDialogOpen(false);
          setSelectedResource(null);
        }}
        onSuccess={handleSuccess}
      />

      <ResourceRequestDialog
        clubId={selectedClub?.id || 0}
        isOpen={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
        onSuccess={handleSuccess}
      />

      <ResourceHistory
        resource={selectedResource}
        history={resourceHistory}
        isLoading={false}
        isOpen={historyDialogOpen}
        onClose={() => {
          setHistoryDialogOpen(false);
          setSelectedResource(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Resource
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this resource? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedResource && (
            <div className="py-4">
              <div className="glass-card p-4 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gradient-primary">
                    <Package className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white mb-1">
                      {selectedResource.name || 'Unnamed Resource'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedResource.description || 'No description'}
                    </p>
                    {selectedResource.lentTo && (
                      <p className="text-sm text-warning mt-2">
                        Warning: This resource is currently lent out to {selectedResource.lentTo}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Delete Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperUserResources;

