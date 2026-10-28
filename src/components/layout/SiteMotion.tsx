"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export default function SiteMotion() {
  const pathname = usePathname();
  useEffect(() => {
    if (
      pathname.startsWith("/rewards") ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08 },
    );
    nodes.forEach((node) => {
      node.classList.add("reveal-ready");
      observer.observe(node);
    });
    return () => {
      observer.disconnect();
      nodes.forEach((node) => node.classList.remove("reveal-ready"));
    };
  }, [pathname]);
  return null;
}
