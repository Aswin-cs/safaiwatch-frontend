import type { NextConfig } from "next";

const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
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
