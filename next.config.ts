import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // WebP only: AVIF is smaller, but it decodes noticeably slower on phones,
  // and these covers decode mid-scroll.
  images: { formats: ["image/webp"] },
};

export default nextConfig;
