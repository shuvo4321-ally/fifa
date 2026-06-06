/** @type {import('next').NextConfig} */
const nextConfig = {
  // Let the phone on the LAN use hot-reload. Without this, Next 16 blocks
  // cross-origin dev resources, so edits only appear after a manual refresh
  // on the device. Add other LAN IPs here if you test from more devices.
  allowedDevOrigins: ["192.168.0.175"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
