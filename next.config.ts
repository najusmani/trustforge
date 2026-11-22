import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WebAssembly files that must be loaded from node_modules, not bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    // Job uploads are sent through server actions (limits in src/lib/plans.ts; Vercel caps bodies near 4.5 MB).
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  // Admin setup and new jobs (automatic skill/agent update) read the TrustForge skill files from disk.
  outputFileTracingIncludes: {
    "/admin": ["./agent/skill/**/*"],
    "/app/jobs/new": ["./agent/skill/**/*"],
    "/app/jobs/[id]": ["./agent/skill/**/*"],
  },
};

export default nextConfig;
