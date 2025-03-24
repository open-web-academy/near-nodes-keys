/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Avoid webpack 5 polyfill issues
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      zlib: require.resolve('browserify-zlib'),
    };
    return config;
  },
  // Add this to disable ISR for Amplify
  experimental: {
    isrMemoryCacheSize: 0,
  },
  // Optional: set output for Amplify compatibility
  output: 'standalone',
}

module.exports = nextConfig