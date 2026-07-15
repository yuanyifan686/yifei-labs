import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: false,
  serverExternalPackages: ["unpdf", "mammoth"],
};

export default nextConfig;
