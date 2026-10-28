"use client";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ArrowUpRight, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import SectionLink from "./SectionLink";
import { restaurant } from "@/lib/site";
const navigation = [
  { name: "Home", href: "/" },
  { name: "Our menu", href: "/menu" },
  { name: "Our place", href: "/our-place#about" },
  { name: "Rewards", href: "/rewards" },
  { name: "Visit us", href: "/contact" },
  { name: "Get the app", href: "/app" },
];
export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    }
    function outside(e: PointerEvent) {
      if (
        !panel.current?.contains(e.target as Node) &&
        !toggle.current?.contains(e.target as Node)
      )
        setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <header className="site-header">
      <div className="site-header-inner container-custom">
        <Link
          className="site-logo"
          href="/"
          aria-label="TeaTime homepage"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/images/teatime-logo2.png"
            alt="TeaTime Restaurant"
            width={623}
            height={623}
            loading="eager"
          />
        </Link>
        <nav className="site-desktop-nav" aria-label="Main navigation">
          {navigation.map((n) => (
            <SectionLink
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
            >
              {n.name}
            </SectionLink>
          ))}
        </nav>
        <div className="site-header-actions">
          <a
            className="site-phone"
            href={`tel:${restaurant.phone}`}
            aria-label="Call TeaTime"
          >
            <Phone size={16} />
            <span>{restaurant.phoneLabel}</span>
          </a>
          <Link
            href="/contact"
            className="site-button site-button-red header-visit"
          >
            Plan your visit <ArrowUpRight size={16} />
          </Link>
          <button
            ref={toggle}
            className="site-menu-toggle"
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>
      <div
        ref={panel}
        id="site-mobile-menu"
        className="site-mobile-menu"
        data-open={open}
        inert={!open}
        aria-hidden={!open}
      >
        <nav aria-label="Mobile navigation">
          {navigation.map((n, i) => (
            <SectionLink
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === n.href ? "page" : undefined}
            >
              <span>0{i + 1}</span>
              {n.name}
              <ArrowUpRight size={20} />
            </SectionLink>
          ))}
        </nav>
        <p>
          Lavington, Nairobi <span>6 am — midnight</span>
        </p>
      </div>
    </header>
  );
}


