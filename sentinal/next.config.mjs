/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['better-sqlite3'],
  turbopack: {
    root: import.meta.dirname,
  },
}

export default nextConfig
