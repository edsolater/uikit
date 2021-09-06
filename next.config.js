const nextBuildId = require('next-build-id')
const withTM = require('next-transpile-modules')(['@edsolater/fnkit'])

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: () => nextBuildId({ dir: __dirname })
}

module.exports = withBundleAnalyzer(withTM(nextConfig))
