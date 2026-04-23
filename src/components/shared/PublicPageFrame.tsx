import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

interface PublicPageFrameProps {
  children: ReactNode;
  isEmbedded: boolean;
  backHref: string;
  title: string;
  showFooter?: boolean;
}

const PublicPageFrame = ({
  children,
  isEmbedded,
  backHref,
  title,
  showFooter = true,
}: PublicPageFrameProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isEmbedded && <Header />}
      <main className={`flex-1 ${isEmbedded ? "pt-5 pb-10" : "pt-20 sm:pt-24 pb-16"}`}>
        {isEmbedded && (
          <div className="container mx-auto max-w-5xl px-4 pb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to={backHref}>
                <ArrowLeft size={16} /> Back
              </Link>
            </Button>
            <p className="mt-3 text-lg font-bold text-foreground">{title}</p>
          </div>
        )}
        {children}
      </main>
      {!isEmbedded && showFooter && <Footer />}
    </div>
  );
};

export default PublicPageFrame;