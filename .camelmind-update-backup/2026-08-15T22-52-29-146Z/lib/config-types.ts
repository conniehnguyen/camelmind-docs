export type AuthProvider = "dev-mock" | "oidc"

export type OidcConfig = {
  issuer: string
  clientId: string
  clientSecret: string
  rolesClaim: string
  roleMapping: Record<string, string>
}

export type AuthConfig = {
  enabled: boolean
  requireLogin: boolean
  provider: AuthProvider
  oidc: OidcConfig
  publicPaths: string[]
}

export type SiteFeatures = {
  showLastUpdated?: boolean
  showLastUpdateAuthor?: boolean
  showFeedbackWidget?: boolean
}

export type ApiSpecEntry = {
  label: string
  file: string
}

export type ApiReferenceConfig = {
  enabled: boolean
  specs: Record<string, ApiSpecEntry>
  navLabel?: string
  languages?: string[]
  roles?: string[]
}

export type LlmsTxtConfig = {
  enabled?: boolean
  directive?: string
}

export type AiViewConfig = {
  enabled?: boolean
  roles?: string[]
}

export type RagCheckEvaluator = "heuristic" | "ragas" | "trulens"

export type RagCheckConfig = {
  enabled?: boolean
  localOnly?: boolean
  roles?: string[]
  allowUserApiKeys?: boolean
  defaultEvaluator?: RagCheckEvaluator
  allowedEvaluators?: RagCheckEvaluator[]
  defaultChunkSize?: number
  defaultChunkOverlap?: number
  maxGeneratedQuestions?: number
}

export type AiConfig = {
  llmsTxt?: LlmsTxtConfig
  aiView?: AiViewConfig
  ragCheck?: RagCheckConfig
}

export type CamelMindConfig = {
  title: string
  tagline: string
  url: string
  contentDir: string
  navFile: string
  versionsFile: string
  auth: AuthConfig
  links: {
    github?: string
  }
  site?: SiteFeatures
  apiReference?: ApiReferenceConfig
  ai?: AiConfig
}
