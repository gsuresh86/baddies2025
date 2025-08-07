/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'owiqmetvqciyphnjdaxy.supabase.co',
      // add other allowed domains here if needed
    ],
    unoptimized: true, // Disable image optimization to avoid Vercel limits
  },
};

module.exports = nextConfig; 