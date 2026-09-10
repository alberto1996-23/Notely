import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: {
    // Allow the maximum Unicode body plus multipart encoding overhead.
    serverActions: { bodySizeLimit: "2mb" },
  },
};
export default config;
