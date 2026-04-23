import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PublicPageFrame from "@/components/shared/PublicPageFrame";
import { useEmbeddedPublicPage } from "@/hooks/useEmbeddedPublicPage";

const PrivacyPolicy = () => {
  const { isEmbedded, backHref } = useEmbeddedPublicPage();

  return (
    <PublicPageFrame isEmbedded={isEmbedded} backHref={backHref} title="Privacy Policy">
      <div className={isEmbedded ? "pb-10 pt-2" : "pt-24 pb-16 sm:pt-32"}>
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

          <div className="prose prose-sm sm:prose-base max-w-none text-foreground/80 space-y-6">
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">1. Introduction</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Perk Back ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how
                we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">2. Information We Collect</h2>
              <p className="text-sm sm:text-base leading-relaxed">We may collect the following information:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
                <li>Full name and email address when you create an account</li>
                <li>Transaction data including purchase amounts, points earned, and merchant names</li>
                <li>Device and browser information for analytics and security</li>
                <li>Loyalty card number and customer reference number</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">3. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
                <li>To provide and maintain our loyalty rewards service</li>
                <li>To process transactions and award points</li>
                <li>To communicate service updates and offers</li>
                <li>To improve our platform and user experience</li>
                <li>To prevent fraud and ensure security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">4. Data Security</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We implement industry-standard security measures to protect your data, including encryption
                in transit and at rest, secure authentication, and role-based access controls.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">5. Data Sharing</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We do not sell your personal information. We only share data with merchants you transact with
                (limited to transaction details) and service providers who help us operate our platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">6. Your Rights</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                You have the right to access, update, or delete your personal data. You can manage your account
                settings or contact us to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">7. Contact Us</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@perkback.com.au" className="text-secondary hover:underline">
                  privacy@perkback.com.au
                </a>
              </p>
            </section>
          </div>

          <div className="mt-10">
            <Button variant="ghost" size="sm" asChild>
              <Link to={isEmbedded ? backHref : "/"}><ArrowLeft size={16} /> {isEmbedded ? "Back" : "Back to Home"}</Link>
            </Button>
          </div>
        </div>
      </div>
    </PublicPageFrame>
  );
};

export default PrivacyPolicy;
