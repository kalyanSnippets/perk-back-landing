import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.png";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const navLinks = [
  { label: "Home", href: "/", isRoute: true },
  { label: "About Us", href: "/about", isRoute: true },
  { label: "Pricing", href: "/pricing", isRoute: true },
  { label: "Testimonials", href: "/testimonials", isRoute: true },
  { label: "Blog", href: "/blog", isRoute: true },
  { label: "Contact Us", href: "/contact", isRoute: true },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin } = useIsAdmin();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-14 sm:h-16 px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img src={perkbackLogo} alt="Perk Back" className="h-12 sm:h-14 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-8">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-[-4px] after:left-0 after:bg-secondary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left transition-colors duration-200"
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-accent hover:text-accent-foreground transition-colors">
              Admin
            </Link>
          )}
          <Button variant="hero" size="lg" asChild>
            <Link to="/get-started">Sign Up / Sign In</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground p-2"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-t border-border px-4 pb-6 pt-2 animate-fade-up">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  {link.label}
                </a>
              )
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-base font-medium text-accent hover:text-accent-foreground transition-colors py-1">
                Admin Panel
              </Link>
            )}
            <Button variant="hero" size="lg" className="mt-2" asChild>
              <Link to="/get-started" onClick={() => setMobileOpen(false)}>Sign Up / Sign In</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
