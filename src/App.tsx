import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import GetStarted from "./pages/GetStarted.tsx";
import CustomerConfirmation from "./pages/CustomerConfirmation.tsx";
import AccessCard from "./pages/AccessCard.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AboutUs from "./pages/AboutUs.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import MerchantDashboard from "./pages/MerchantDashboard.tsx";
import MerchantTransactions from "./pages/MerchantTransactions.tsx";
import MerchantSettings from "./pages/MerchantSettings.tsx";
import ContactUs from "./pages/ContactUs.tsx";
import TestimonialsPage from "./pages/TestimonialsPage.tsx";
import Pricing from "./pages/Pricing.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/customer/auth" element={<GetStarted />} />
          <Route path="/customer/confirmation" element={<CustomerConfirmation />} />
          <Route path="/customer/access-card" element={<AccessCard />} />
          <Route path="/merchant/auth" element={<GetStarted />} />
          <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
          <Route path="/merchant/transactions" element={<MerchantTransactions />} />
          <Route path="/merchant/settings" element={<MerchantSettings />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
