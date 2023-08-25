const withTM = require("next-transpile-modules")(["@simplewebauthn/browser"]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withTM(nextConfig);
