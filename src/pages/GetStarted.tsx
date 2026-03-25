import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

const GetStarted = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Sparkles className="text-primary-foreground" size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-up">
          Welcome to <span className="text-secondary">Perk Back</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-8 animate-fade-up-delay-1">
          You're one step away from earning rewards everywhere. Sign up is coming soon!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up-delay-2">
          <Button variant="hero" size="xl">
            Join the Waitlist
          </Button>
          <Button variant="hero-outline" size="lg" asChild>
            <Link to="/">
              <ArrowLeft size={18} />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
