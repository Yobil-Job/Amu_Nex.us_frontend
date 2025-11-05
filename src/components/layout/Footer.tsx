import { Link } from 'react-router-dom';
import { Building2, Calendar, Bell, Shield, Home, Mail, Github, Heart, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleDisplayName } from '@/lib/roles';

const Footer = () => {
  const { user } = useAuth();

  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Clubs', href: '/clubs', icon: Building2 },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Announcements', href: '/announcements', icon: Bell },
  ];

  return (
    <footer className="glass-card border-t border-primary/20 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold neon-text text-white">AMU NEX.US</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your comprehensive university club management system. Connect, engage, and thrive in your academic community.
            </p>
            {user && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-primary/20">
                <Shield className="h-3 w-3" />
                <span>Logged in as {getRoleDisplayName(user.role)}</span>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                    >
                      <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Shield className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>My Profile</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/fees"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Calendar className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Fees & Payments</span>
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                  onClick={(e) => {
                    e.preventDefault();
                    // Add help/guide functionality here
                  }}
                >
                  <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Help & Support</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Get in Touch</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>support@amunexus.edu</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Addis Ababa University</span>
              </li>
              <li className="pt-2 border-t border-primary/20">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3 text-accent animate-pulse" />
                  <span>Made with passion for students</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>© {currentYear} AMU NEX.US Management System.</span>
              <span className="hidden md:inline">All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  // Add privacy policy link
                }}
              >
                Privacy Policy
              </a>
              <span className="text-xs text-muted-foreground">•</span>
              <a
                href="#"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  // Add terms of service link
                }}
              >
                Terms of Service
              </a>
              <span className="text-xs text-muted-foreground">•</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

