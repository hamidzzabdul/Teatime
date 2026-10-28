import { ArrowUpRight, Bike } from "lucide-react";
const platforms = [
  { name: "Glovo", url: "https://glovoapp.com/", className: "platform-glovo" },
  {
    name: "Bolt Food",
    url: "https://food.bolt.eu/",
    className: "platform-bolt",
  },
  {
    name: "Uber Eats",
    url: "https://www.ubereats.com/",
    className: "platform-uber",
  },
];
export default function DeliverySection() {
  return (
    <section
      id="delivery"
      className="site-section delivery-editorial"
      aria-labelledby="delivery-heading"
    >
      <div className="container-custom delivery-grid">
        <div data-reveal>
          <p className="site-eyebrow">
            <Bike size={17} /> A LITTLE TEATIME, WHERE YOU ARE
          </p>
          <h2 id="delivery-heading">
            Staying in?
            <br />
            <em>We get it.</em>
          </h2>
          <p>
            Find TeaTime on your preferred delivery app. Enter your address
            there to see availability, delivery fees and arrival estimates.
          </p>
        </div>
        <div className="delivery-platforms" data-reveal>
          {platforms.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={p.className}>{p.name}</span>
              <span>Search TeaTime in the app</span>
              <ArrowUpRight size={20} />
            </a>
          ))}
          <small>
            These links open the delivery platforms. Availability and checkout
            are handled in their apps.
          </small>
        </div>
      </div>
    </section>
  );
}
