/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Silence optional deps pulled by some wallet connectors in SSR builds
    config.resolve.alias["pino-pretty"] = false;
    config.resolve.alias["@react-native-async-storage/async-storage"] = false;
    return config;
  },
};

module.exports = nextConfig;
