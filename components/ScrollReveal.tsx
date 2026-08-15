"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // delay in ms
  direction?: "up" | "down" | "left" | "right" | "scale" | "fade";
  once?: boolean;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [once]);

  const getDirectionClasses = () => {
    switch (direction) {
      case "up":
        return isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8";
      case "down":
        return isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-8";
      case "left":
        return isVisible
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-8";
      case "right":
        return isVisible
          ? "opacity-100 translate-x-0"
          : "opacity-0 -translate-x-8";
      case "scale":
        return isVisible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95";
      case "fade":
        return isVisible ? "opacity-100" : "opacity-0";
      default:
        return isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8";
    }
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${getDirectionClasses()} ${className}`}
    >
      {children}
    </div>
  );
}
