"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // delay in ms
  direction?: "up" | "down" | "left" | "right" | "scale";
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const getDirectionClasses = () => {
    switch (direction) {
      case "up":
        return isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10";
      case "down":
        return isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-10";
      case "left":
        return isVisible
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-10";
      case "right":
        return isVisible
          ? "opacity-100 translate-x-0"
          : "opacity-0 -translate-x-10";
      case "scale":
        return isVisible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-90";
      default:
        return isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10";
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
