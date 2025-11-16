import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Linkedin, Phone, Code, Heart, ExternalLink, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              About AMU NEX.US
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive university club management system designed to connect, engage, and empower students
            </p>
          </div>

          <Card className="glass-card border-primary/20 glow-effect">
            <CardContent className="p-8 md:p-12">
              <div className="space-y-8">
                <div className="text-center space-y-6">
                  <div className="relative mx-auto w-48 h-48 mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-2xl"></div>
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl">
                      <img
                        src="/assets/developer.jpg"
                        alt="Eyob Weldetensay"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 items-center justify-center">
                        <Code className="h-24 w-24 text-primary/40" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                      Eyob Weldetensay
                    </h2>
                    <p className="text-lg text-primary font-medium">
                      Full Stack Developer
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-8 border-t border-primary/20">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      Development
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      AMU NEX.US is a modern, full-stack club management system built with cutting-edge technologies
                      to provide students with an intuitive platform for managing clubs, events, memberships, and more.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      The system features role-based access control, real-time notifications, comprehensive event management,
                      financial tracking, and seamless communication tools designed specifically for university environments.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-accent" />
                      Mission
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Our mission is to create a digital ecosystem that empowers students to discover, join, and actively
                      participate in clubs and organizations that align with their interests and career goals.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      We believe in fostering community engagement, facilitating seamless communication, and providing
                      tools that help students make the most of their university experience.
                    </p>
                  </div>
                </div>

                <div className="pt-8 border-t border-primary/20">
                  <h3 className="text-xl font-semibold text-white mb-6 text-center">Get in Touch</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto border-primary/20 hover:bg-primary/10 hover:border-primary/40 relative z-50 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open('https://www.linkedin.com/in/eyob-weldetensay-a68160254', '_blank', 'noopener,noreferrer');
                        }}
                        style={{ pointerEvents: 'auto', zIndex: 9999 }}
                      >
                        <Linkedin className="h-5 w-5 mr-2" />
                        LinkedIn Profile
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                        onClick={() => window.location.href = 'tel:+251710710401'}
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        +251 710 710 401
                      </Button>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Mail className="h-5 w-5 text-primary" />
                      <span className="text-white">eyobwldetensay@gmail.com</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-primary/20">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4 text-accent animate-pulse" />
                    <span>Made with passion for students at Arba Minch University</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-white"
            >
              ← Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

