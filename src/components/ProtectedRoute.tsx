import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "customer" | "merchant" | "admin";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, isCustomer, isMerchant, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/get-started" replace />;
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
