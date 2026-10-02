import type { NextConfig } from "next";

import path from "path";

const rawUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
const backendUrl = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : "http://localhost:4000";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/signin",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/signup",
        destination: "/login",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
