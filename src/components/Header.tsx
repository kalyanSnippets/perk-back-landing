import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, CreditCard, LayoutDashboard, Shield } from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo-224.webp";
import perkbackLogo2x from "@/assets/perkback-logo-448.webp";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Map of public route → dynamic import. Triggered on hover/touchstart so the
// lazy chunk + its dependencies are warm by the time the user actually clicks.
const ROUTE_PREFETCH: Record<string, () => Promise<unknown>> = {
  "/about": () => import("@/pages/AboutUs.tsx"),
  "/pricing": () => import("@/pages/Pricing.tsx"),
  "/testimonials": () => import("@/pages/TestimonialsPage.tsx"),
  "/blog": () => import("@/pages/Blog.tsx"),
  "/contact": () => import("@/pages/ContactUs.tsx"),
  "/reviews": () => import("@/pages/ReviewPage.tsx"),
};

const prefetched = new Set<string>();
const prefetchRoute = (href: string) => {
  if (prefetched.has(href)) return;
  const loader = ROUTE_PREFETCH[href];
  if (!loader) return;
  prefetched.add(href);
  loader().catch(() => prefetched.delete(href));
};

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
  { label: "Reviews", href: "/reviews" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, isMerchant, isCustomer, authReady, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isCustomerPage = location.pathname.startsWith("/customer/");
  const filteredNavLinks = isCustomerPage
    ? navLinks.filter(l => l.label !== "Pricing")
    : navLinks;

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/30 shadow-sm">
      <div className="container mx-auto flex items-center justify-between h-14 sm:h-16 px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img
            src={perkbackLogo}
            srcSet={`${perkbackLogo} 224w, ${perkbackLogo2x} 448w`}
            sizes="(max-width: 640px) 192px, 224px"
            alt="Perk Back"
            width={224}
            height={56}
            fetchPriority="high"
            decoding="async"
            className="h-12 sm:h-14 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-5">
          {filteredNavLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onMouseEnter={() => prefetchRoute(link.href)}
              onTouchStart={() => prefetchRoute(link.href)}
              onFocus={() => prefetchRoute(link.href)}
              className="text-xs xl:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 whitespace-nowrap flex-shrink-0"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          {!authReady ? (
            <Skeleton className="h-10 w-[150px] rounded-full" />
          ) : user ? (
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
              {isCustomer && (
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
            <Button variant="hero" size="pill" asChild>
              <Link to="/get-started">Sign Up / Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-foreground p-2"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-background border-t border-border px-4 pb-6 pt-2 animate-fade-up">
          <nav className="flex flex-col gap-3">
            {filteredNavLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                onTouchStart={() => prefetchRoute(link.href)}
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {link.label}
              </Link>
            ))}

            {!authReady ? (
              <Skeleton className="h-12 w-full mt-2 rounded-full" />
            ) : user ? (
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
                {isCustomer && (
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
