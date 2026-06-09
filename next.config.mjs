/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow inline brand logo images from any external domain.
  // Supabase Storage URLs and arbitrary CDN URLs need this.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig
