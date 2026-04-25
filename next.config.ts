import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** pdfkit loads AFM/ICC from node_modules/pdfkit/js/data at runtime; bundling breaks __dirname on Vercel (ENOENT). */
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
