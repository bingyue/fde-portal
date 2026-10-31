import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/workbench/projects/*/analyze": ["./skills/**/*"],
    "/api/workbench/projects/*/commands": ["./skills/**/*"],
    "/api/workbench/skills/*": ["./skills/**/SKILL.md"],
  },
};

export default nextConfig;
