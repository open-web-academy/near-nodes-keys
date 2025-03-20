/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer')
      };
      
      // Add buffer to externals
      config.externals = {
        ...config.externals,
        bufferutil: 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
      };
    }
    return config;
  },
  // Add this to prevent injection conflicts
  experimental: {
    scriptLoader: {
      deferScripts: true,
    }
  }
}

module.exports = nextConfig