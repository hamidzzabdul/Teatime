import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { restaurant } from "@/lib/site";
export default function AboutSection() {
  return (
    <section
      id="about"
      className="site-section about-editorial"
      aria-labelledby="about-heading"
    >
      <div className="container-custom about-editorial-grid">
        <div data-reveal>
          <p className="site-eyebrow">MORE THAN JUST TEA</p>
          <h2 id="about-heading">
            The everyday
            <br />
            deserves a<br />
            <em>good place.</em>
          </h2>
          <p>
            TeaTime brings together warming drinks, generous plates and a place
            to settle in. From breakfast and local dishes to burgers, pasta and
            desserts, the menu leaves room for everyone at the table.
          </p>
          <p>
            You’ll find us at Legend Valley Business Park in Lavington. Come by
            for a quiet cup, a meal with friends, or whatever the day calls for.
          </p>
          <Link href="/contact" className="site-text-link">
            Come and make yourself at home <ArrowUpRight size={17} />
          </Link>
        </div>
        <figure className="about-venue">
          <div className="about-venue-image">
            <Image
              src="/images/restaurant/private-dining.jpeg"
              alt="TeaTime dining space with a long table and warm pendant lighting"
              fill
              sizes="(min-width:900px) 50vw,100vw"
            />
          </div>
          <figcaption>
            <span>
              <MapPin size={14} /> {restaurant.address}
            </span>
            <span>NAIROBI, KE</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
