import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import DeferredClientWidgets from "@/components/DeferredClientWidgets";
import FirstVisitGate from "@/components/onboarding/FirstVisitGate";
import React, { Suspense } from "react";

// Eagerly loaded landing + auth entry (critical for first paint)
import Index from "./pages/Index.tsx";
import GetStarted from "./pages/GetStarted.tsx";

// Lazy-loaded secondary public pages
const ResetPassword = React.lazy(() => import("./pages/ResetPassword.tsx"));
const AboutUs = React.lazy(() => import("./pages/AboutUs.tsx"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy.tsx"));
const ContactUs = React.lazy(() => import("./pages/ContactUs.tsx"));
const TestimonialsPage = React.lazy(() => import("./pages/TestimonialsPage.tsx"));
const Pricing = React.lazy(() => import("./pages/Pricing.tsx"));
const Blog = React.lazy(() => import("./pages/Blog.tsx"));
const BlogPost = React.lazy(() => import("./pages/BlogPost.tsx"));
const NotFound = React.lazy(() => import("./pages/NotFound.tsx"));

// Lazy-loaded protected pages
const ChooseRole = React.lazy(() => import("./pages/ChooseRole.tsx"));
const CustomerConfirmation = React.lazy(() => import("./pages/CustomerConfirmation.tsx"));
const AccessCard = React.lazy(() => import("./pages/AccessCard.tsx"));
const MerchantDashboard = React.lazy(() => import("./pages/MerchantDashboard.tsx"));
const MerchantCustomers = React.lazy(() => import("./pages/MerchantCustomers.tsx"));
const MerchantInsights = React.lazy(() => import("./pages/MerchantInsights.tsx"));
const MerchantMarketing = React.lazy(() => import("./pages/MerchantMarketing.tsx"));
const MerchantPoints = React.lazy(() => import("./pages/MerchantPoints.tsx"));
const MerchantSettings = React.lazy(() => import("./pages/MerchantSettings.tsx"));
const AdminPanel = React.lazy(() => import("./pages/AdminPanel.tsx"));
const ReviewPage = React.lazy(() => import("./pages/ReviewPage.tsx"));

// Lightweight skeleton page — avoids the blank-screen flash that the
// previous full-screen "Loading..." caused on every route transition.
const PageSkeleton = () => (
  <div className="min-h-screen bg-background pt-16 sm:pt-20">
    <div className="container mx-auto px-4 lg:px-8 py-8 space-y-6">
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
      <div className="h-4 w-72 max-w-full rounded-md bg-muted/70 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <ScrollToTop />
        <DeferredClientWidgets />
        <AuthProvider>
          <FirstVisitGate />
          {/* Toasters mounted inside router so they aren't in the initial critical path */}
          <Toaster />
          <Sonner />
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public pages */}
              <Route path="/" element={<Index />} />
              <Route path="/get-started" element={<GetStarted />} />
              <Route path="/customer/auth" element={<GetStarted />} />
              <Route path="/merchant/auth" element={<GetStarted />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/testimonials" element={<TestimonialsPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/reviews" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />

              {/* Role Chooser */}
              <Route path="/choose-role" element={<ProtectedRoute><ChooseRole /></ProtectedRoute>} />

              {/* Protected: Customer */}
              <Route path="/customer/confirmation" element={<ProtectedRoute requiredRole="customer"><CustomerConfirmation /></ProtectedRoute>} />
              <Route path="/customer/access-card" element={<ProtectedRoute requiredRole="customer"><AccessCard /></ProtectedRoute>} />

              {/* Protected: Merchant — Consolidated */}
              <Route path="/merchant/dashboard" element={<ProtectedRoute requiredRole="merchant"><MerchantDashboard /></ProtectedRoute>} />
              <Route path="/merchant/customers" element={<ProtectedRoute requiredRole="merchant"><MerchantCustomers /></ProtectedRoute>} />
              <Route path="/merchant/points" element={<ProtectedRoute requiredRole="merchant"><MerchantPoints /></ProtectedRoute>} />
              <Route path="/merchant/insights" element={<ProtectedRoute requiredRole="merchant"><MerchantInsights /></ProtectedRoute>} />
              <Route path="/merchant/marketing" element={<ProtectedRoute requiredRole="merchant"><MerchantMarketing /></ProtectedRoute>} />
              <Route path="/merchant/settings" element={<ProtectedRoute requiredRole="merchant"><MerchantSettings /></ProtectedRoute>} />

              {/* Old routes → redirect to consolidated pages */}
              <Route path="/merchant/transactions" element={<Navigate to="/merchant/insights?tab=transactions" replace />} />
              <Route path="/merchant/analytics" element={<Navigate to="/merchant/insights?tab=analytics" replace />} />
              <Route path="/merchant/reports" element={<Navigate to="/merchant/insights?tab=reports" replace />} />
              <Route path="/merchant/redemptions" element={<Navigate to="/merchant/insights?tab=redemptions" replace />} />
              <Route path="/merchant/campaigns" element={<Navigate to="/merchant/marketing?tab=campaigns" replace />} />
              <Route path="/merchant/rewards" element={<Navigate to="/merchant/marketing?tab=rewards" replace />} />
              <Route path="/merchant/promotions" element={<Navigate to="/merchant/marketing?tab=promotions" replace />} />
              <Route path="/merchant/birthday-offers" element={<Navigate to="/merchant/marketing?tab=birthday" replace />} />
              <Route path="/merchant/monthly-offers" element={<Navigate to="/merchant/marketing?tab=monthly" replace />} />
              <Route path="/merchant/ai-suggestions" element={<Navigate to="/merchant/marketing?tab=campaigns" replace />} />
              <Route path="/merchant/gamification" element={<Navigate to="/merchant/points?tab=stamps" replace />} />
              <Route path="/merchant/pos" element={<Navigate to="/merchant/settings?tab=pos" replace />} />

              {/* Protected: Admin */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
