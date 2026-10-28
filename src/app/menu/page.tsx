import { pageMetadata } from "@/lib/site";
import MenuBrowser from "@/components/menu/MenuBrowser";
import { Download, ArrowUpRight } from "lucide-react";
import Link from "next/link";
export const metadata = pageMetadata(
  "Our Menu: Food, Tea, Coffee & Desserts",
  "Explore the complete TeaTime menu with KSh prices. Search for a dish, browse food and drinks, and save your favourites for your next visit.",
  "/menu",
);
export default function MenuPage() {
  return (
    <main id="main-content" className="restaurant-menu">
      <div className="container-custom menu-page-intro">
        <div>
          <p className="site-eyebrow">SOMETHING FOR EVERY APPETITE</p>
          <h1>
            What sounds
            <br />
            <em>good today?</em>
          </h1>
          <p>
            From a first cup to a table full. Find a dish, save a favourite, and
            make your next visit yours.
          </p>
        </div>
        <div className="menu-downloads">
          <span>TAKE YOUR TIME WITH THE MENU</span>
          <a href="/menus/teatime-food-menu.pdf" download>
            <Download size={15} /> Food menu <span>PDF</span>
          </a>
          <a href="/menus/teatime-drinks-menu.pdf" download>
            <Download size={15} /> Drinks menu <span>PDF</span>
          </a>
          <Link href="/contact">
            Ingredients or allergies? Ask our team <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <MenuBrowser />
    </main>
  );
}
