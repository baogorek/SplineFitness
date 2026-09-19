import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const movementLabOrigin = process.env.MOVEMENT_LAB_ORIGIN?.replace(/\/$/, "")
  || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8910" : "");

const nextConfig: NextConfig = {
  agentRules: false,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  async rewrites() {
    if (!movementLabOrigin) return [];
    return {
      beforeFiles: [
        { source: "/movement-lab", destination: `${movementLabOrigin}/movement-lab/` },
        { source: "/movement-lab/:path*", destination: `${movementLabOrigin}/movement-lab/:path*` },
        { source: "/api/biomechanics/:path*", destination: `${movementLabOrigin}/api/biomechanics/:path*` },
      ],
    };
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
