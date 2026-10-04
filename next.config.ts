import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // The migrations folder is read at start-up, so keep it next to server.js.
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*"],
  },
  // Uploaded photos live on a volume, never inside the build.
  outputFileTracingExcludes: {
    "/**": ["./data/**/*"],
  },
};

export default nextConfig;
