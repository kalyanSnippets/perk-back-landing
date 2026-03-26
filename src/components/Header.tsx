import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, CreditCard, LayoutDashboard, Shield } from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, isMerchant, isCustomer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-14 sm:h-16 px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img src={perkbackLogo} alt="Perk Back" className="h-12 sm:h-14 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-accent hover:text-accent-foreground transition-colors flex items-center gap-1">
                  <Shield size={14} />
                  Admin
                </Link>
              )}
              {isMerchant && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/merchant/dashboard" className="gap-1.5">
                    <LayoutDashboard size={14} />
                    Dashboard
                  </Link>
                </Button>
              )}
              {isCustomer && !isMerchant && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/customer/access-card" className="gap-1.5">
                    <CreditCard size={14} />
                    My Card
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
                <LogOut size={14} />
                Logout
              </Button>
            </>
          ) : (
            <Button variant="hero" size="lg" asChild>
              <Link to="/get-started">Sign Up / Sign In</Link>
            </Button>
          )}
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
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-base font-medium text-accent hover:text-accent-foreground transition-colors py-1 flex items-center gap-2">
                    <Shield size={16} />
                    Admin Panel
                  </Link>
                )}
                {isMerchant && (
                  <Link to="/merchant/dashboard" onClick={() => setMobileOpen(false)} className="text-base font-medium text-foreground hover:text-foreground transition-colors py-1 flex items-center gap-2">
                    <LayoutDashboard size={16} />
                    Merchant Dashboard
                  </Link>
                )}
                {isCustomer && !isMerchant && (
                  <Link to="/customer/access-card" onClick={() => setMobileOpen(false)} className="text-base font-medium text-foreground hover:text-foreground transition-colors py-1 flex items-center gap-2">
                    <CreditCard size={16} />
                    Access My Card
                  </Link>
                )}
                <Button variant="outline" size="lg" className="mt-2 gap-2" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="hero" size="lg" className="mt-2" asChild>
                <Link to="/get-started" onClick={() => setMobileOpen(false)}>Sign Up / Sign In</Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
