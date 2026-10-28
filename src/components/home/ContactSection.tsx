import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Phone, Mail, Clock3 } from "lucide-react";
import { restaurant } from "@/lib/site";
import VisitStatus from "./VisitStatus";
export default function ContactSection({ page = false }: { page?: boolean }) {
  const Heading = page ? "h1" : "h2";
  return (
    <section
      id="contact"
      className={`site-section visit-editorial ${page ? "visit-page" : ""}`}
      aria-labelledby="contact-heading"
    >
      <div className="container-custom">
        <div className="site-section-heading" data-reveal>
          <div>
            <p className="site-eyebrow">LET’S MAKE IT TEATIME</p>
            <Heading id="contact-heading">
              A place to arrive.
              <br />
              <em>A reason to stay.</em>
            </Heading>
          </div>
          <VisitStatus />
        </div>
        <div className="visit-grid">
          <div className="visit-details" data-reveal>
            <p className="visit-lead">
              Your next cup, conversation or catch-up starts in Lavington.
            </p>
            <dl>
              <div>
                <MapPin size={19} />
                <dt>Find us</dt>
                <dd>
                  {restaurant.address}
                  <a href={restaurant.mapsUrl} target="_blank" rel="noreferrer">
                    Get directions <ArrowUpRight size={14} />
                  </a>
                </dd>
              </div>
              <div>
                <Clock3 size={19} />
                <dt>Opening hours</dt>
                <dd>
                  Every day
                  <br />
                  {restaurant.hours}
                </dd>
              </div>
              <div>
                <Phone size={19} />
                <dt>Table & menu enquiries</dt>
                <dd>
                  <a href={`tel:${restaurant.phone}`}>
                    {restaurant.phoneLabel}
                  </a>
                  <small>
                    Call to ask about a table, menu availability or dietary
                    requirements.
                  </small>
                </dd>
              </div>
              <div>
                <Mail size={19} />
                <dt>Say hello</dt>
                <dd>
                  <a href={`mailto:${restaurant.email}`}>{restaurant.email}</a>
                </dd>
              </div>
            </dl>
            <div className="visit-actions">
              <a
                href={`tel:${restaurant.phone}`}
                className="site-button site-button-red"
              >
                Call the team <ArrowUpRight size={16} />
              </a>
              <Link href="/menu" className="site-text-link">
                Before you visit, our menu <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <figure className="visit-photo">
            <Image
              src="/images/restaurant/entrance.jpeg"
              alt="TeaTime sign and restaurant entrance at Legend Valley Business Park"
              fill
              sizes="(min-width:900px) 50vw,100vw"
            />
            <figcaption>
              Look for the TeaTime sign. We’ll see you inside.
            </figcaption>
          </figure>
        </div>
        {page && (
          <div className="visit-map">
            <div>
              <h2>Find your way here.</h2>
              <a
                className="site-text-link"
                href={restaurant.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open Google Maps <ArrowUpRight size={16} />
              </a>
            </div>
            <iframe
              src={restaurant.mapEmbedUrl}
              title="TeaTime Nairobi location on Google Maps"
              width="1200"
              height="400"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        )}
      </div>
    </section>
  );
}
