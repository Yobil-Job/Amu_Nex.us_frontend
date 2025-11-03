import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-mesh relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      
      <div className="relative text-center space-y-8 max-w-2xl mx-auto animate-scale-in">
        <div className="inline-block p-6 rounded-3xl bg-gradient-primary/10 backdrop-blur-sm border border-primary/20 shadow-colored-primary">
          <AlertCircle className="h-24 w-24 text-primary animate-pulse" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-8xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-3xl font-bold text-foreground">
            Oops! Page not found
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        <Link to="/">
          <Button variant="gradient" size="lg" className="gap-2 shadow-colored-primary text-base">
            <Home className="h-5 w-5" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
