import { ImageResponse } from "next/og";

// Generate this metadata route at build time for cPanel static hosting.
export const dynamic = "force-static";

export const alt = "TeaTime Restaurant — Great food. Good moments.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: "#fff8f0", padding: "80px", color: "#231f20", borderBottom: "18px solid #ed1c24" }}><div style={{ display: "flex", color: "#c9141b", fontSize: 28, letterSpacing: 5 }}>TEATIME RESTAURANT</div><div style={{ display: "flex", fontSize: 92, fontWeight: 700, marginTop: 35 }}>Great food.</div><div style={{ display: "flex", fontSize: 92, color: "#c9141b", fontWeight: 700 }}>Good moments.</div><div style={{ display: "flex", fontSize: 26, marginTop: 32 }}>Sandwiches · Wraps · Fries · Paratha rolls · Tapas</div></div>, size);
}
