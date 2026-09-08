/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework and version in a response header; it is one
  // fewer hint for an automated scanner looking for a known-vulnerable build.
  poweredByHeader: false,

  // Trailing-slash redirects are a small but real open-redirect surface when
  // combined with certain proxy configurations.
  skipTrailingSlashRedirect: false,

  reactStrictMode: true,

  images: {
    /**
     * Exactly one remote host, pinned to one path.
     *
     * A bare `res.cloudinary.com` entry would let the optimiser fetch from any
     * Cloudinary account on the internet — the optimiser is a proxy, and an
     * over-broad pattern turns it into an open one. Restricting the pathname
     * to this cloud means it can only ever fetch our own assets.
     */
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
