import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export default function MealMoments() {
  return (
    <section className="moments-editorial" aria-labelledby="moments-heading">
      <div className="moments-photo">
        <Image
          src="/images/restaurant/booth-seating.jpeg"
          alt="Comfortable booth seating and greenery inside TeaTime"
          fill
          sizes="(min-width:900px) 55vw,100vw"
        />
      </div>
      <div className="moments-copy" data-reveal>
        <p className="site-eyebrow">PULL UP A CHAIR</p>
        <h2 id="moments-heading">
          A quick coffee.
          <br />A long catch-up.
          <br />
          <em>Your kind of place.</em>
        </h2>
        <p>
          Some visits are a quick bite between things. Others turn into an
          afternoon. Our Lavington home has room for both.
        </p>
        <div className="moment-links">
          <Link href="/menu#coffee">
            <span>For your morning pause</span>Coffee & something sweet{" "}
            <ArrowUpRight size={18} />
          </Link>
          <Link href="/menu#club-sandwiches">
            <span>For the lunch break</span>Sandwiches & comfort food{" "}
            <ArrowUpRight size={18} />
          </Link>
          <Link href="/contact">
            <span>For a table together</span>Plan your next visit{" "}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
