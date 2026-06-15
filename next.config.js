/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
    serverComponentsExternalPackages: ['better-sqlite3'],
  },

  // Exclude the separate sentinal/ landing page app from this build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  webpack: (config) => {
    // Suppress viem/tempo dynamic require warning (benign but noisy)
    config.module = config.module || {};
    config.module.exprContextCritical = false;

    // Ignore the sentinal/ subfolder (it's a separate Next.js project)
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/sentinal/**', '**/node_modules/**'],
    };

    return config;
  },
};

module.exports = nextConfig;
