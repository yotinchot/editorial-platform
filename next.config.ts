import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  turbopack: {
    // Pin the workspace root — the user's home directory has an unrelated
    // package-lock.json that Next.js would otherwise infer as the root.
    root: path.join(__dirname),
  },
};

export default nextConfig;
