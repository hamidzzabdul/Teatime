import Hero from "@/components/home/Hero";
import MenuCategories from "@/components/home/MenuCategories";
import PopularMenu from "@/components/home/PopularMenu";
import MealMoments from "@/components/home/MealMoments";
import AboutSection from "@/components/home/AboutSection";
import RewardsSection from "@/components/home/RewardsSection";
import DeliverySection from "@/components/home/DeliverySection";
import FaqSection from "@/components/home/FaqSection";
import ContactSection from "@/components/home/ContactSection";
export default function RestaurantLanding() {
  return (
    <>
      <Hero />
      <MenuCategories />
      <PopularMenu />
      <MealMoments />
      <AboutSection />
      <RewardsSection />
      <DeliverySection />
      <FaqSection />
      <ContactSection />
    </>
  );
}


