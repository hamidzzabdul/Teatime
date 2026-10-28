import type { Metadata } from "next";

// Set the actual public origin at deployment; never infer it from an email address.
const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
function publicOrigin(value: string | undefined) {
  if (!value) return undefined;
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) URL");
  return url.origin;
}
export const comingSoon = process.env.TEATIME_COMING_SOON === "true";
export const siteUrl = publicOrigin(configuredUrl);
export const restaurant = {
  name: "TeaTime Restaurant",
  // Contact, location and hours confirmed by the owner.
  phone: "+254799999904",
  phoneLabel: "+254 799 999 904",
  email: "info@teatime.co.ke",
  address: process.env.TEATIME_ADDRESS?.trim() || "Legend Valley Business Park, Lavington, Nairobi",
  hours: process.env.TEATIME_OPENING_HOURS?.trim() || "6:00 am – midnight",
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.806797244041!2d36.772890499999995!3d-1.2902033000000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1b73c6b0d8d1%3A0x6327190de8debbb2!2sTeatime%20Nairobi!5e0!3m2!1sen!2ske!4v1790844334253!5m2!1sen!2ske",
  mapsUrl: process.env.TEATIME_MAPS_URL?.trim() || "https://www.google.com/maps?cid=7144706881378761650",
};

export function pageMetadata(title: string, description: string, path: string): Metadata {
  if (comingSoon) {
    title = "Our Website Is Coming Soon";
    description = "TeaTime’s new website is brewing. Visit us at Legend Valley Business Park, Lavington, Nairobi, or get in touch while we prepare something delicious.";
    path = "/";
  }
  const url = siteUrl ? new URL(path, siteUrl).href : undefined;
  return {
    title: { absolute: `${title} | ${restaurant.name}` }, description,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: { title: `${title} | ${restaurant.name}`, description, siteName: restaurant.name, type: "website", ...(url ? { url } : {}) },
    twitter: { card: "summary_large_image", title: `${title} | ${restaurant.name}`, description },
  };
}
