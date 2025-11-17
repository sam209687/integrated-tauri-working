/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // ✅ use this for SSR inside Tauri
};

export default nextConfig;
