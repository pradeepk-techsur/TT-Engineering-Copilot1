/** @type {import('next').NextConfig} */
const nextConfig = {
  // xlsx uses fs.writeFileSync internally — opt-out of bundling so Node.js fs is available at runtime
  serverExternalPackages: ['xlsx'],
  // Allow embedding in preview iframe — do NOT set X-Frame-Options or frame-ancestors: none
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // No X-Frame-Options header — needed for Pivota preview iframe
        ],
      },
    ];
  },
};
export default nextConfig;
