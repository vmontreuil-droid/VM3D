/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.0.250'],
  transpilePackages: ['@novnc/novnc'],
}

module.exports = nextConfig