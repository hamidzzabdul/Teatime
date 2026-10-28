import RestaurantLanding from "@/components/home/RestaurantLanding";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Our place in Lavington, Nairobi", "Make time for TeaTime. Explore our restaurant, menu and visit information.", "/our-place");
export default function OurPlace() {
  return <main id="main-content" className="restaurant-home restaurant-story"><RestaurantLanding /></main>;
}
