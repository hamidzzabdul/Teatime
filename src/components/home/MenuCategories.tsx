import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { menuCategories, menuItems } from "@/data/menu";
const highlights = [
  {
    id: "breakfast",
    title: "Start the day right.",
    copy: "Breakfast, your way.",
    fallback: "hot-drinks",
  },
  {
    id: "burgers",
    title: "A proper appetite.",
    copy: "Burgers, wraps & all the good stuff.",
    fallback: "special-burgers",
  },
  {
    id: "coffee",
    title: "Stay for another.",
    copy: "Coffee, tea & conversation.",
    fallback: "hot-drinks",
  },
  {
    id: "desserts",
    title: "Room for a little more.",
    copy: "Something sweet to finish.",
    fallback: "cakes",
  },
];
export default function MenuCategories() {
  return (
    <section
      className="site-section category-section"
      aria-labelledby="categories-heading"
    >
      <div className="container-custom">
        <div className="site-section-heading" data-reveal>
          <div>
            <p className="site-eyebrow">WHAT ARE YOU IN THE MOOD FOR?</p>
            <h2 id="categories-heading">
              There’s a TeaTime
              <br />
              for <em>every appetite.</em>
            </h2>
          </div>
          <Link className="site-text-link" href="/menu">
            Explore all {menuCategories.length} categories{" "}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="category-editorial-grid">
          {highlights.map((c, i) => {
            const item =
              menuItems.find((m) => m.category === c.id && m.image) ||
              menuItems.find((m) => m.category === c.fallback && m.image);
            return (
              <Link
                key={c.id}
                href={`/menu#${c.id}`}
                className="category-editorial"
                data-reveal
              >
                <div className="category-editorial-photo">
                  {item?.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(min-width:900px) 25vw,50vw"
                    />
                  )}
                  <span className="category-number">0{i + 1}</span>
                  <span className="category-arrow">
                    <ArrowUpRight size={19} />
                  </span>
                </div>
                <small>{c.copy}</small>
                <h3>{c.title}</h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
