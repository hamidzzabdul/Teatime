import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { restaurant } from "@/lib/site";
export default function Footer() {
  return (
    <footer className="restaurant-footer">
      <div className="container-custom">
        <div className="footer-top">
          <Link href="/" className="footer-logo" aria-label="TeaTime homepage">
            <Image
              src="/images/teatime-logo.png"
              alt="TeaTime Restaurant"
              width={623}
              height={623}
            />
          </Link>
          <p>
            Make time for
            <br />
            <em>TeaTime.</em>
          </p>
          <a
            className="site-button site-button-red"
            href={`tel:${restaurant.phone}`}
          >
            We’ll save you a hello <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="footer-grid">
          <div>
            <p className="site-eyebrow">OUR LITTLE CORNER OF NAIROBI</p>
            <p>{restaurant.address}</p>
            <a
              className="site-text-link"
              href={restaurant.mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Find us <ArrowUpRight size={15} />
            </a>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/menu">Our menu</Link>
            <Link href="/our-place#about">Our place</Link>
            <Link href="/rewards">Rewards club</Link>
            <Link href="/contact">Plan your visit</Link>
          </nav>
          <div>
            <p className="site-eyebrow">STAY A LITTLE LONGER</p>
            <p>Open daily · {restaurant.hours}</p>
            <a href={`tel:${restaurant.phone}`}>{restaurant.phoneLabel}</a>
            <a href={`mailto:${restaurant.email}`}>{restaurant.email}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} TeaTime Restaurant</span>
          <Link href="/rewards/terms">Rewards terms & privacy</Link>
          <span>LAVINGTON, NAIROBI · TEATIME. ANYTIME.</span>
        </div>
      </div>
    </footer>
  );
}

