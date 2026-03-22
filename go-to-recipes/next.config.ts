import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // When the editor workspace is a parent folder (e.g. Simmer/), Turbopack can
  // otherwise resolve CSS @import "tailwindcss" from the wrong directory.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
