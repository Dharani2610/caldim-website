/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  // Don't advertise the framework and version in a response header; it is one
  // fewer hint for an automated scanner looking for a known-vulnerable build.
  poweredByHeader: false,
  skipTrailingSlashRedirect: false,
  reactStrictMode: true,

  images: {
    unoptimized: true,
    remotePatterns: process.env.CLOUDINARY_CLOUD_NAME
      ? [
          {
            protocol: "https",
            hostname: "res.cloudinary.com",
            pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/**`,
          },
        ]
      : [],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1200, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  experimental: {
    // These ship native .node binaries. Webpack can't parse them, and they
    // must run in Node rather than being bundled into the server chunk.
    serverComponentsExternalPackages: ["sharp", "@node-rs/argon2"],
    // Import only the icons actually used, rather than the whole set.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
