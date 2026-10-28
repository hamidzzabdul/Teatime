"use client";

import Link from "next/link";
import { type MouseEvent, type ReactNode } from "react";

type SectionLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  "aria-current"?: "page";
};

function scrollToSection(href: string) {
  const id = href.split("#")[1];
  const section = id ? document.getElementById(id) : null;

  if (!section) return false;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  section.scrollIntoView({
    behavior: reducedMotion ? "instant" : "smooth",
    block: "start",
  });

  return true;
}

export default function SectionLink({
  href,
  children,
  className,
  onClick,
  "aria-current": ariaCurrent,
}: SectionLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.();

    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    if (window.location.pathname === "/" && href.startsWith("/#")) {
      event.preventDefault();

      window.history.replaceState(window.history.state, "", href);

      // Give the mobile dropdown time to close before scrolling.
      window.setTimeout(() => {
        scrollToSection(href);
      }, 320);
    }
  }

  return (
    <Link aria-current={ariaCurrent} href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
