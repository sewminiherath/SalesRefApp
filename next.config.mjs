/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === "true"
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? ""

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGithubActions && repoName ? `/${repoName}` : "",
  assetPrefix: isGithubActions && repoName ? `/${repoName}/` : "",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  // Suppress hydration warnings for portals
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

export default nextConfig

