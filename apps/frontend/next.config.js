const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@draw-app/common'],
    outputFileTracingRoot: path.join(__dirname, '../../'),
  
};

module.exports = nextConfig;