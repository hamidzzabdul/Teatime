import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import VisitStatus from "./VisitStatus";
import { restaurant } from "@/lib/site";
export default function Hero() {
  return (
    <>
      <section className="restaurant-hero">
        <div className="hero-copy">
          <p className="site-eyebrow">
            <span /> A LITTLE PLACE IN LAVINGTON
          </p>
          <h1>
            Good food.
            <br />
            Unhurried
            <br />
            <em>moments.</em>
          </h1>
          <p className="hero-description">
            From the first cup to the last conversation. Come for your
            favourites. Stay for a little TeaTime.
          </p>
          <div className="hero-actions">
            <Link href="/menu" className="site-button site-button-red">
              Find your next favourite <ArrowRight size={18} />
            </Link>
            <Link className="site-text-link" href="/contact">
              Find us <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="hero-visit">
            <VisitStatus />
            <a href={restaurant.mapsUrl} target="_blank" rel="noreferrer">
              <MapPin size={14} /> Legend Valley Business Park
            </a>
          </div>
        </div>
        <div className="hero-photograph">
          <Image
            src="/images/restaurant/dining-room.jpeg"
            alt="Warmly lit TeaTime dining room in Lavington, Nairobi"
            fill
            sizes="(min-width:900px) 55vw, 100vw"
            loading="eager"
            fetchPriority="high"
            className="hero-room-photo"
          />
          <div className="hero-photo-caption">
            <span>YOUR TABLE IS WAITING</span>
            <span>
              Lavington, Nairobi <ArrowUpRight size={16} />
            </span>
          </div>
          <Link href="/menu#hot-drinks" className="hero-tea-note">
            <span className="hero-tea-photo">
              <Image
                src="/images/menu/teatime-karak.jpeg"
                alt="TeaTime karak tea"
                fill
                sizes="100px"
              />
            </span>
            <span>
              <small>A GOOD PLACE TO START</small>
              <strong>Make it a karak.</strong>
              <span>
                Explore our tea <ArrowRight size={13} />
              </span>
            </span>
          </Link>
        </div>
      </section>
      <div className="restaurant-ribbon">
        <span>TEATIME. ANYTIME.</span>
        <span>Breakfast & slow mornings</span>
        <i />
        <span>Lunch & familiar faces</span>
        <i />
        <span>Dinner & one more conversation</span>
        <Link href="/menu">
          Find your moment <ArrowUpRight size={15} />
        </Link>
      </div>
    </>
  );
}
