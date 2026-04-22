import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "customer" | "merchant" | "admin";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, loading, isCustomer, isMerchant, isAdmin } = useAuth();
  const isMobileViewport = typeof window !== "undefined"
    ? window.matchMedia("(max-width: 767px)").matches
    : false;

  const intendedPath = `${location.pathname}${location.search}${location.hash}`;
  const loginTarget = `/get-started?${new URLSearchParams({
    ...(isMobileViewport ? { app: "1" } : {}),
    next: intendedPath,
  }).toString()}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginTarget} replace />;
  }

  if (requiredRole === "customer" && !isCustomer) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "merchant" && !isMerchant) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
