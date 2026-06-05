/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiHost = process.env.API_URL || 'http://localhost:8000';
    const destinationUrl = apiHost.startsWith('http') ? `${apiHost}/api/:path*` : `http://${apiHost}/api/:path*`;
    return [
      {
        source: '/api/:path*',
        destination: destinationUrl,
      },
    ];
  },
};

module.exports = nextConfig;
