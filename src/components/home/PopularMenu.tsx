import MenuPrice from "@/components/menu/MenuPrice";
import MenuImage from "@/components/menu/MenuImage";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { menuCategories, menuItems } from "@/data/menu";
const ids = [
  "teatime-special-burger",
  "dynamite-fries",
  "pulled-chicken-club",
  "spicy-chicken-tacos",
];
export default function PopularMenu() {
  const items = ids.flatMap((id) => menuItems.filter((i) => i.id === id));
  return (
    <section
      className="site-section menu-selection"
      aria-labelledby="featured-heading"
    >
      <div className="container-custom">
        <div className="site-section-heading" data-reveal>
          <div>
            <p className="site-eyebrow">FROM OUR KITCHEN</p>
            <h2 id="featured-heading">
              Some delicious
              <br />
              <em>possibilities.</em>
            </h2>
          </div>
          <p>
            Something hearty. Something to share.
            <br />A few introductions to the TeaTime menu.
          </p>
        </div>
        <div className="selected-dishes">
          {items.map((item, i) => (
            <article key={item.id} className="selected-dish" data-reveal>
              <Link
                href={`/menu?dish=${item.id}#${item.category}`}
                className="selected-dish-image"
                aria-label={`View ${item.name}`}
              >
                {item.image && (
                  <MenuImage
                    src={item.image}
                    alt={item.name}
                    sizes="(min-width:900px) 25vw,50vw"
                  />
                )}
                <span>0{i + 1}</span>
              </Link>
              <p className="dish-category">
                {menuCategories.find((c) => c.id === item.category)?.name}
              </p>
              <Link href={`/menu?dish=${item.id}#${item.category}`}>
                <h3>
                  {item.name}
                  <ArrowUpRight size={16} />
                </h3>
              </Link>
              <MenuPrice item={item} />
            </article>
          ))}
        </div>
        <Link href="/menu" className="site-button site-button-dark">
          Take a look at the full menu <ArrowUpRight size={17} />
        </Link>
      </div>
    </section>
  );
}
