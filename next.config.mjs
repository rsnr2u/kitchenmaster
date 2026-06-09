import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest:            'public',          // SW files output to /public/sw.js + workbox files
  cacheOnFrontEndNav: true,           // Cache pages as users navigate
  aggressiveFrontEndNavCaching: true, // Pre-cache navigated pages
  reloadOnOnline: true,               // Auto-reload when connection restores
  disable:         process.env.NODE_ENV === 'development', // Skip SW in dev (avoids cache confusion)
  workboxOptions: {
    disableDevLogs: true,
  },
})

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

export default withPWA(nextConfig)
