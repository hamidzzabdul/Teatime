import ContactSection from "@/components/home/ContactSection";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Contact & Visit", "Find TeaTime Restaurant at Legend Valley Business Park, Lavington, Nairobi. Open 6 am to midnight. Call +254 799 999 904 or get directions.", "/contact");

export default function ContactPage() {
  return <main id="main-content" className="min-h-screen bg-brand-cream"><ContactSection page /></main>;
}
