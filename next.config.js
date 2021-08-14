const withTM = require('next-transpile-modules')(['@edsolater/fnkit'])
/** @type {import('next').NextConfig} */
module.exports = withTM({
  reactStrictMode: true
})
