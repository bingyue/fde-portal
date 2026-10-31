import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/workbench/projects/*/analyze": ["./skills/**/SKILL.md"],
    "/api/workbench/skills/*": ["./skills/**/SKILL.md"],
  },
};

export default nextConfig;
