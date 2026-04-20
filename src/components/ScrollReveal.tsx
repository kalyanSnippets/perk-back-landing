import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Single shared IntersectionObserver across the whole app to avoid spawning
// dozens of observers on long pages (Pricing, Blog, Testimonials).
type RevealCallback = () => void;
const callbacks = new WeakMap<Element, RevealCallback>();

let sharedObserver: IntersectionObserver | null = null;
const getObserver = (): IntersectionObserver => {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = callbacks.get(entry.target);
          if (cb) {
            cb();
            sharedObserver?.unobserve(entry.target);
            callbacks.delete(entry.target);
          }
        }
      }
    },
    { threshold: 0.15 }
  );
  return sharedObserver;
};

const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(
  ({ children, className = "", delay = 0 }, _forwardedRef) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const node = ref.current;
      if (!node) return;
      const observer = getObserver();
      callbacks.set(node, () => {
        if (delay > 0) setTimeout(() => setIsVisible(true), delay);
        else setIsVisible(true);
      });
      observer.observe(node);
      return () => {
        observer.unobserve(node);
        callbacks.delete(node);
      };
    }, [delay]);

    return (
      <div
        ref={ref}
        className={`transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        } ${className}`}
      >
        {children}
      </div>
    );
  }
);

ScrollReveal.displayName = "ScrollReveal";

export default ScrollReveal;
