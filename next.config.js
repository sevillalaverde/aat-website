/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // This setting helps ensure routing works correctly on many hosts.
  trailingSlash: true,
};

module.exports = nextConfig;