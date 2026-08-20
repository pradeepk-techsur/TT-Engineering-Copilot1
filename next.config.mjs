/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a second server (e.g. a test run) build into its own directory
  // instead of corrupting the webpack runtime the dev server is serving from.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // xlsx uses fs.writeFileSync internally — opt-out of bundling so Node.js fs is available at runtime
  serverExternalPackages: ['xlsx', 'docx'],
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
