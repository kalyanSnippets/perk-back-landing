import { Link } from "react-router-dom";
import perkbackLogo from "@/assets/perkback-logo.png";

const Footer = () => {
  return (
    <footer id="contact" className="bg-primary text-primary-foreground py-12 sm:py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <img src={perkbackLogo} alt="Perk Back" className="h-9 w-auto brightness-0 invert" />
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Earn rewards everywhere. One card. One wallet.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/50">Product</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/70">
              <li><a href="#how-it-works" className="hover:text-primary-foreground transition-colors">How It Works</a></li>
              <li><a href="#rewards" className="hover:text-primary-foreground transition-colors">Rewards</a></li>
              <li><a href="#benefits" className="hover:text-primary-foreground transition-colors">For Merchants</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/50">Company</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/70">
              <li><Link to="/about" className="hover:text-primary-foreground transition-colors">About</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/50">Connect</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/70">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs sm:text-sm text-primary-foreground/50">
            © 2026 Perk Back. All rights reserved.
          </p>
          <Link to="/get-started" className="text-sm text-accent font-semibold hover:text-accent/80 transition-colors">
            Explore Now →
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
