/**
 * app/manifest.js — Web App Manifest (PWA)
 *
 * Next.js App Router generates /manifest.webmanifest automatically from this file.
 * No separate manifest.json or <link> tag needed — Next.js handles it.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */

export default function manifest() {
  return {
    name:             'KitchenMaster AI',
    short_name:       'KitchenMaster',
    description:      'Authentic Telugu recipes with smart serving size adjustments and AI-powered cooking guidance.',
    start_url:        '/',
    scope:            '/',
    display:          'standalone',           // Hides browser chrome for native app feel
    orientation:      'portrait',
    background_color: '#FAF6F0',              // Matches app warm cream background
    theme_color:      '#1E120C',              // Brand dark brown — colours the status bar on Android
    categories:       ['food', 'lifestyle'],

    icons: [
      {
        src:     '/icons/icon-192x192.png',
        sizes:   '192x192',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icons/icon-192x192.png',
        sizes:   '192x192',
        type:    'image/png',
        purpose: 'maskable',                 // Adaptive icon for Android 8+
      },
      {
        src:     '/icons/icon-512x512.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icons/icon-512x512.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],

    screenshots: [
      {
        src:          '/icons/icon-512x512.png',
        sizes:        '512x512',
        type:         'image/png',
        form_factor:  'narrow',
        label:        'KitchenMaster AI home screen',
      },
    ],

    shortcuts: [
      {
        name:      'AI Chef',
        short_name:'AI Chef',
        url:       '/ai-chef',
        description: 'Generate an AI-powered recipe instantly',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  }
}
