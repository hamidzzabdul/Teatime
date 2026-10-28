import Image from "next/image";
import { ArrowUpRight, Coffee, Mail, MapPin, Phone } from "lucide-react";
import { restaurant } from "@/lib/site";

export default function ComingSoon() {
  return <main id="main-content" className="coming-soon">
    <header className="coming-header">
      <Image src="/images/teatime-logo2.png" alt="TeaTime Restaurant" width={75} height={91} priority className="coming-logo" />
      <span className="coming-location">Lavington, Nairobi <span aria-hidden="true">↗</span></span>
    </header>
    <div className="coming-grid">
      <section className="coming-copy" aria-labelledby="coming-title">
        <p className="coming-eyebrow"><span aria-hidden="true" /> Our website is brewing</p>
        <h1 id="coming-title">Good things<br />take a little<br /><em>TeaTime.</em></h1>
        <p className="coming-intro">A fresh look. The same love for good food.</p>
        <p className="coming-description">We’re putting the finishing touches on our new website. Soon, your next favourite dish, refreshing drink and TeaTime moment will be just a click away.</p>
        <a href={`mailto:${restaurant.email}`} className="coming-contact"><Mail size={18} aria-hidden="true" /> Get in touch <ArrowUpRight size={19} aria-hidden="true" /></a>
        <p className="coming-note">Our website is coming soon. You can still find us in Lavington.</p>
      </section>
      <div className="coming-art" aria-hidden="true">
        <span className="coming-art-label">A LITTLE PAUSE. A LOT OF FLAVOUR.</span>
        <div className="coming-orbit coming-orbit-one" /><div className="coming-orbit coming-orbit-two" />
        <div className="coming-cup"><Coffee strokeWidth={0.8} /></div>
        <span className="coming-art-word">TeaTime<span>Anytime.</span></span>
        <span className="coming-art-bottom">GOOD FOOD · GOOD COMPANY</span>
      </div>
    </div>
    <div className="coming-details">
      <a href={restaurant.mapsUrl} target="_blank" rel="noopener noreferrer"><MapPin size={17} aria-hidden="true" /><span>{restaurant.address}</span><ArrowUpRight size={16} aria-hidden="true" /></a>
      <a href={`tel:${restaurant.phone}`}><Phone size={16} aria-hidden="true" />{restaurant.phoneLabel}</a>
      <span>Open {restaurant.hours}</span>
    </div>
    <footer className="coming-footer"><span>© {new Date().getFullYear()} TeaTime Restaurant.</span><span>Made for moments worth sharing.</span></footer>
  </main>;
}
