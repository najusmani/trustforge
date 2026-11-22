import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WebAssembly files that must be loaded from node_modules, not bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    // Job uploads are sent through server actions (limits in src/lib/plans.ts; Vercel caps bodies near 4.5 MB).
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  // The admin "Set up agents" action reads the TrustForge skill files from disk.
  outputFileTracingIncludes: {
    "/admin": ["./agent/skill/**/*"],
  },
};

export default nextConfig;
