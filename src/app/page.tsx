import AppHome from "@/components/webapp/AppHome";
import RestaurantLanding from "@/components/home/RestaurantLanding";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Restaurant in Lavington, Nairobi", "Make time for TeaTime. Explore our menu, find your next favourite and plan a visit to Legend Valley Business Park, Lavington.", "/");
export default function Home() {
  return <main id="main-content" className="responsive-home">
    <div className="mobile-home"><AppHome /></div>
    <div className="desktop-home restaurant-home restaurant-story"><RestaurantLanding /></div>
  </main>;
}
