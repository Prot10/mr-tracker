/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  experimental: {
    appDir: true, // Assicurati che sia attivo se usi il file-based routing
  },
};

module.exports = nextConfig;
