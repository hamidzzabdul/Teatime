import WebAppProvider from "@/components/webapp/WebAppProvider";
import WebAppChrome from "@/components/webapp/WebAppChrome";

import type { Metadata, Viewport } from "next";
import { restaurant, siteUrl, comingSoon } from "@/lib/site";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import ComingSoon from "@/components/ComingSoon";
import SiteMotion from "@/components/layout/SiteMotion";
import Header from "@/components/layout/Header";

import "./globals.css";
import "./professional.css";
import "./webapp.css";
import Footer from "@/components/home/Footer";

const headingFont = Cormorant_Garamond({
  variable: "--font-teatime-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Manrope({
  variable: "--font-teatime-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#faf7f2"};
export const metadata: Metadata = { appleWebApp:{capable:true,statusBarStyle:"default",title:"TeaTime"},
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: { default: "TeaTime Restaurant", template: "%s | TeaTime Restaurant" },
  description:
    "Explore food, drinks and Kenyan shilling menu prices at TeaTime Restaurant in Lavington, Nairobi.",
  applicationName: "TeaTime Restaurant",
  icons: {
    icon: {
      url: "/images/teatime-icon.png",
      type: "image/png",
      sizes: "256x256",
    },
    shortcut: "/favicon.ico?v=teatime-logo",
    apple: {
      url: "/images/teatime-apple-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
};
const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: restaurant.name,
  ...(siteUrl
    ? {
        url: siteUrl,
        image: `${siteUrl}/images/teatime-logo.png`,
        ...(!comingSoon ? { hasMenu: `${siteUrl}/menu` } : {}),
      }
    : {}),
  telephone: restaurant.phone,
  hasMap: restaurant.mapsUrl,
  address: {
    "@type": "PostalAddress",
    streetAddress: restaurant.address,
    addressLocality: "Nairobi",
    addressCountry: "KE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} antialiased`}
      >
        {comingSoon ? (
          <ComingSoon />
        ) : (
          <>
            <WebAppProvider><SiteMotion />
            <div id="site-content">
              <a href="#main-content" className="skip-link">
                Skip to content
              </a>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(restaurantSchema).replace(
                    /</g,
                    "\\u003c",
                  ),
                }}
              />
              <Header /><WebAppChrome />
              {children}
              <Footer />
            </div></WebAppProvider>
          </>
        )}
      </body>
    </html>
  );
}

