import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Settings, Save, Loader2, Building2, Mail, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const SettingsForm = () => {
  const [formData, setFormData] = useState({
    universityName: '',
    universityAddress: '',
    universityEmail: '',
    universityWebsite: '',
    systemName: 'AMU NEX.US',
    systemLogo: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('systemSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure systemName is set to AMU NEX.US if it's the old name
        if (parsed.systemName && (parsed.systemName.includes('Guildmate') || parsed.systemName.includes('guildmate'))) {
          parsed.systemName = 'AMU NEX.US';
          localStorage.setItem('systemSettings', JSON.stringify(parsed));
        }
        setFormData(parsed);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Note: This is a mock implementation
      // In production, this would save to backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Save to localStorage as mock
      localStorage.setItem('systemSettings', JSON.stringify(formData));
      
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          System Settings
        </CardTitle>
        <CardDescription>
          Configure system branding and university information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Branding Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-lg">Branding</h3>
            
            <div className="space-y-2">
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={formData.systemName}
                onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                placeholder="AMU NEX.US"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemLogo">System Logo URL</Label>
              <Input
                id="systemLogo"
                type="url"
                value={formData.systemLogo}
                onChange={(e) => setFormData({ ...formData, systemLogo: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <div className="luxury-divider"></div>

          {/* University Information Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              University Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="universityName">University Name</Label>
              <Input
                id="universityName"
                value={formData.universityName}
                onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                placeholder="Enter university name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="universityAddress">University Address</Label>
              <Textarea
                id="universityAddress"
                value={formData.universityAddress}
                onChange={(e) => setFormData({ ...formData, universityAddress: e.target.value })}
                placeholder="Enter university address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="universityEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="universityEmail"
                  type="email"
                  value={formData.universityEmail}
                  onChange={(e) => setFormData({ ...formData, universityEmail: e.target.value })}
                  placeholder="contact@university.edu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="universityWebsite" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="universityWebsite"
                  type="url"
                  value={formData.universityWebsite}
                  onChange={(e) => setFormData({ ...formData, universityWebsite: e.target.value })}
                  placeholder="https://university.edu"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="support@university.edu"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SettingsForm;

