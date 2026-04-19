import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";

// Below-the-fold sections are split into their own chunks so the
// landing-page bundle only has to ship Header + Hero on first paint.
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const RewardsShowcase = lazy(() => import("@/components/RewardsShowcase"));
const BenefitsSection = lazy(() => import("@/components/BenefitsSection"));
const Footer = lazy(() => import("@/components/Footer"));

// Reserve vertical space so lazy sections don't trigger layout shifts.
const SectionPlaceholder = ({ minHeight }: { minHeight: string }) => (
  <div aria-hidden style={{ minHeight }} />
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <Suspense fallback={<SectionPlaceholder minHeight="600px" />}>
        <HowItWorks />
      </Suspense>
      <Suspense fallback={<SectionPlaceholder minHeight="600px" />}>
        <RewardsShowcase />
      </Suspense>
      <Suspense fallback={<SectionPlaceholder minHeight="500px" />}>
        <BenefitsSection />
      </Suspense>
      <Suspense fallback={<SectionPlaceholder minHeight="300px" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
