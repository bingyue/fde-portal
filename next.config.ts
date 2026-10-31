import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  ...(process.env.FDE_STANDALONE === "1"
    ? { output: "standalone" as const }
    : {}),
  outputFileTracingIncludes: {
    "/api/workbench/projects/*/analyze": ["./skills/**/*"],
    "/api/workbench/projects/*/commands": ["./skills/**/*"],
    "/api/workbench/skills/*": ["./skills/**/SKILL.md"],
  },
};

export default nextConfig;
