/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // ✅ SSR for Tauri
  
  // External packages that should not be bundled
  serverExternalPackages: [
    'node-thermal-printer',
    'serialport', // Often needed by thermal printers
    'usb',        // USB dependencies
  ],
  
  // Webpack configuration for thermal printer
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle node-thermal-printer for server
      config.externals = config.externals || [];
      config.externals.push({
        'node-thermal-printer': 'commonjs node-thermal-printer',
        'serialport': 'commonjs serialport',
        'usb': 'commonjs usb',
      });
    }
    return config;
  },
  
  // Experimental features for server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // For QR code images
    },
  },
};

export default nextConfig;