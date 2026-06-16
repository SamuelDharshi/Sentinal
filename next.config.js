/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Allow any origin for Vercel deployment
      allowedOrigins: ['localhost:3000'],
    },
    // Keep better-sqlite3 as an external package (native addon — cannot be bundled)
    serverComponentsExternalPackages: ['better-sqlite3'],
  },

  // Exclude the separate sentinal/ landing page app from this build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  webpack: (config, { isServer }) => {
    // Suppress viem/tempo dynamic require warning (benign but noisy)
    config.module = config.module || {};
    config.module.exprContextCritical = false;

    // Ignore the sentinal/ subfolder (it's a separate Next.js project)
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/sentinal/**', '**/node_modules/**'],
    };

    // On Vercel serverless, better-sqlite3 won't be available.
    // Mark it as external so webpack doesn't try to bundle it.
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'better-sqlite3',
      ];
    }

    return config;
  },
};

module.exports = nextConfig;

