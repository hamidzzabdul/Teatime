import AppSettings from "@/components/webapp/AppSettings";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Your app" };
export default function AppPage() { return <AppSettings />; }
