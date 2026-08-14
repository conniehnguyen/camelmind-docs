export type HttpMethod = "get" | "post" | "put" | "delete" | "patch" | "head" | "options"

export type SchemaObject = {
  type?: string
  format?: string
  description?: string
  title?: string
  properties?: Record<string, SchemaObject>
  additionalProperties?: SchemaObject | boolean
  items?: SchemaObject
  required?: string[]
  enum?: (string | number | boolean | null)[]
  $ref?: string
  allOf?: SchemaObject[]
  anyOf?: SchemaObject[]
  oneOf?: SchemaObject[]
  nullable?: boolean
  example?: unknown
  default?: unknown
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  readOnly?: boolean
  writeOnly?: boolean
  deprecated?: boolean
}

export type ParsedParameter = {
  name: string
  in: "path" | "query" | "header" | "cookie"
  description?: string
  required: boolean
  schema: SchemaObject
  example?: unknown
  deprecated?: boolean
}

export type ParsedRequestBody = {
  description?: string
  required: boolean
  contentType: string
  schema: SchemaObject
}

export type ParsedResponse = {
  statusCode: string
  description: string
  contentType?: string
  schema?: SchemaObject
}

export type CodeSample = {
  lang: string
  label?: string
  source: string
}

export type ParsedOperation = {
  tag: string
  tagSlug: string
  operationId: string
  summary: string
  description?: string
  method: HttpMethod
  path: string
  parameters: ParsedParameter[]
  requestBody?: ParsedRequestBody
  responses: ParsedResponse[]
  securitySchemes: string[]
  codeSamples: CodeSample[]
  deprecated?: boolean
}

export type ParsedTag = {
  name: string
  slug: string
  description?: string
  operations: ParsedOperation[]
}

export type SecuritySchemeObject = {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect"
  scheme?: string
  in?: string
  name?: string
  description?: string
}

export type ParsedSpec = {
  info: {
    title: string
    version: string
    description?: string
  }
  baseUrl: string
  tags: ParsedTag[]
  allOperations: ParsedOperation[]
  schemas: Record<string, SchemaObject>
  securitySchemes: Record<string, SecuritySchemeObject>
}
