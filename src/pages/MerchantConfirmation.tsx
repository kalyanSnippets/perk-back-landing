import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MailCheck, ArrowRight } from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.webp";

const MerchantConfirmation = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-light-blue via-background to-background -z-10" />
      <div className="max-w-lg w-full text-center space-y-6">
        <Link to="/" className="inline-block">
          <img src={perkbackLogo} alt="Perk Back" className="h-10 sm:h-12 w-auto mx-auto" />
        </Link>

        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center animate-fade-up">
          <MailCheck className="text-primary-foreground" size={40} />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground animate-fade-up-delay-1">
          Check your email to verify your account
        </h1>
        <p className="text-muted-foreground animate-fade-up-delay-2">
          We've sent a confirmation link to your inbox. Click it to activate your merchant account, then sign in to finish setting up your store.
        </p>

        <div className="bg-card rounded-2xl p-5 border border-border/50 text-left text-sm text-muted-foreground space-y-2 animate-fade-up-delay-2">
          <p className="font-semibold text-foreground">What's next</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open the confirmation email and click the link.</li>
            <li>Sign in with the email and password you just created.</li>
            <li>Complete your store profile in Settings.</li>
          </ol>
          <p className="text-[11px] pt-2">Didn't get the email? Check your spam folder or try signing in to resend it.</p>
        </div>

        <Button variant="hero" size="lg" className="gap-2 w-full sm:w-auto" asChild>
          <Link to="/get-started">Go to sign in <ArrowRight size={16} /></Link>
        </Button>
      </div>
    </div>
  );
};

export default MerchantConfirmation;
