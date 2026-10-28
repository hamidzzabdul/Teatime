import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  devIndicators: false,
  trailingSlash: true,

  allowedDevOrigins: ["192.168.1.16"],

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
        search: "",
      },

      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/35940565/**",
      },

      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        pathname: "/photo/2022/03/11/23/47/pizza-7063096_1280.jpg",
        search: "",
      },

      {
        protocol: "https",

        hostname: "images.unsplash.com",

        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
