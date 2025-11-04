import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Building2 } from 'lucide-react';
import Logo from '/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      // Error is already handled and shown via toast in AuthContext
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-mesh relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      
      <Card className="w-full max-w-md relative animate-scale-in shadow-lg hover:shadow-xl border-primary/10">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="relative flex items-center justify-center animate-fade-in">
              {/* Outer animated glow ring */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40 blur-xl animate-pulse"></div>
              {/* Beautiful rounded frame with luxury styling */}
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-primary/15 backdrop-blur-md border-2 border-primary/50 shadow-2xl shadow-primary/30 overflow-hidden animate-float">
                {/* Inner gradient ring */}
                <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20"></div>
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                {/* Logo with rounded corners and premium styling */}
                <img 
                  src={Logo} 
                  alt="AMU NEX.US" 
                  className="relative z-10 h-16 w-16 object-contain rounded-xl p-2 transition-transform duration-300 hover:scale-110"
                  style={{ 
                    filter: 'drop-shadow(0 4px 12px rgba(248, 181, 0, 0.4))',
                    borderRadius: '12px'
                  }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Welcome to AMU NEX.US</CardTitle>
            <CardDescription className="text-base">Login to manage your university clubs</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="gradient" className="w-full mt-6" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
