import type { Viewport } from "next";
import RewardsApp from "./RewardsApp";
import { pageMetadata } from "@/lib/site";
import "./rewards.css";
import "./mobile-app.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f7f5",
};

export const metadata = pageMetadata(
  "TeaTime Rewards",
  "A little more joy in every visit. Earn points, discover rewards and enjoy your daily spin at TeaTime.",
  "/rewards",
);
export default function RewardsPage() {
  return <RewardsApp />;
}
