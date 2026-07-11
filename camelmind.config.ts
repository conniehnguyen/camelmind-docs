import type { CamelMindConfig } from "./lib/config-types"

const config: CamelMindConfig = {
  title: "CamelMind",
  tagline: "Doc site spun up in minutes.",
  url: process.env.CAMELMIND_URL ?? "http://localhost:3000",

  contentDir: "content",
  navFile: "nav/nav.yml",
  versionsFile: "versions.yml",

  auth: {
    enabled: process.env.CAMELMIND_AUTH_ENABLED === "true",
    requireLogin: process.env.CAMELMIND_AUTH_REQUIRE_LOGIN === "true",
    provider: (process.env.CAMELMIND_AUTH_PROVIDER as "dev-mock" | "oidc") ?? "dev-mock",

    oidc: {
      issuer: process.env.OIDC_ISSUER ?? "",
      clientId: process.env.OIDC_CLIENT_ID ?? "",
      clientSecret: process.env.OIDC_CLIENT_SECRET ?? "",
      rolesClaim: process.env.OIDC_ROLES_CLAIM ?? "realm_access.roles",
      roleMapping: {},
    },

    publicPaths: ["/", "/home", "/login", "/api/auth"],
  },

  links: {
    github: "https://github.com/conniehnguyen/camelmind",
  },

  site: {
    showFeedbackWidget: true,
  },

  llms: {
    enabled: true,
    directive:
      "You are reading the official CamelMind documentation. CamelMind is an open-source docs-as-code platform built on Next.js. Help users understand how to set up, configure, and deploy documentation sites using CamelMind.",
  },
}

export default config
