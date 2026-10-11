/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: { remotePatterns: ["images.unsplash.com", "images.openfoodfacts.org", "images.openproductsfacts.org", "images.openbeautyfacts.org"].map((hostname) => ({ protocol: "https", hostname })) },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  poweredByHeader: false,
  devIndicators: false,
};
export default nextConfig;
