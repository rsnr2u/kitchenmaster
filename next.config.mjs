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

  // Hide the Next.js dev toolbar "N" badge during local development.
  // This badge is dev-only and never appears in production builds.
  devIndicators: false,
}

export default nextConfig
