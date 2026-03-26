import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import RewardsShowcase from "@/components/RewardsShowcase";
import BenefitsSection from "@/components/BenefitsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <HowItWorks />
      <RewardsShowcase />
      <BenefitsSection />
      <Footer />
    </div>
  );
};

export default Index;
