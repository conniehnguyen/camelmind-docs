import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import { resolveRef } from "./api-utils"
import type {
  ParsedSpec,
  ParsedOperation,
  ParsedTag,
  ParsedParameter,
  ParsedRequestBody,
  ParsedResponse,
  CodeSample,
  SchemaObject,
  SecuritySchemeObject,
  HttpMethod,
} from "./api-types"

const _specCache = new Map<string, ParsedSpec>()

export function loadApiSpec(specPath: string, languages?: string[]): ParsedSpec {
  const cacheKey = `${specPath}|${JSON.stringify(languages ?? null)}`
  const cached = _specCache.get(cacheKey)
  if (cached) return cached
  const raw = fs.readFileSync(path.join(process.cwd(), specPath), "utf-8")
  const doc = yaml.load(raw) as Record<string, unknown>
  const parsed = parseOpenApi(doc, languages)
  _specCache.set(cacheKey, parsed)
  return parsed
}

export function clearApiCache() {
  _specCache.clear()
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

// Generate a single example value from a schema (one level, no deep recursion)
function examplePrimitive(schema: SchemaObject): unknown {
  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default
  if (schema.enum?.length) return schema.enum[0]
  switch (schema.type) {
    case "string":
      if (schema.format === "date-time") return "2024-01-15T10:30:00Z"
      if (schema.format === "date") return "2024-01-15"
      if (schema.format === "uuid") return "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      if (schema.format === "email") return "user@example.com"
      if (schema.format === "uri") return "https://example.com"
      return "string"
    case "integer":
      return schema.minimum ?? 1
    case "number":
      return schema.minimum ?? 0
    case "boolean":
      return true
    default:
      return "string"
  }
}

function generateExampleValue(
  schema: SchemaObject,
  schemas: Record<string, SchemaObject>,
  depth = 0
): unknown {
  if (depth > 4) return {}

  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, schemas)
    if (!resolved) return {}
    return generateExampleValue(resolved, schemas, depth + 1)
  }

  if (schema.allOf?.length) {
    const merged: Record<string, unknown> = {}
    for (const sub of schema.allOf) {
      const val = generateExampleValue(sub, schemas, depth + 1)
      if (typeof val === "object" && val !== null) Object.assign(merged, val)
    }
    return merged
  }

  if (schema.type === "object" || schema.properties) {
    const obj: Record<string, unknown> = {}
    for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
      obj[key] = generateExampleValue(propSchema, schemas, depth + 1)
    }
    return obj
  }

  if (schema.type === "array") {
    const item = schema.items
      ? generateExampleValue(schema.items, schemas, depth + 1)
      : "string"
    return [item]
  }

  return examplePrimitive(schema)
}

// ---- Code generators ----

function interpolatePath(urlPath: string, parameters: ParsedParameter[]): string {
  const pathParams = parameters.filter((p) => p.in === "path")
  let result = urlPath
  for (const p of pathParams) {
    const val = p.example ?? examplePrimitive(p.schema)
    result = result.replace(`{${p.name}}`, String(val))
  }
  return result
}

function buildQueryString(parameters: ParsedParameter[]): string {
  const qp = parameters.filter((p) => p.in === "query" && p.required)
  if (!qp.length) return ""
  const pairs = qp.map((p) => {
    const val = p.example ?? examplePrimitive(p.schema)
    return `${p.name}=${encodeURIComponent(String(val))}`
  })
  return "?" + pairs.join("&")
}

function detectAuthHeader(securitySchemes: Record<string, SecuritySchemeObject>, schemeName: string): string | null {
  const scheme = securitySchemes[schemeName]
  if (!scheme) return null
  if (scheme.type === "http" && scheme.scheme === "bearer") return "Bearer <your-token>"
  if (scheme.type === "apiKey" && scheme.in === "header") return null // custom header
  return null
}

function getAuthHeader(op: ParsedOperation, securitySchemes: Record<string, SecuritySchemeObject>): string | null {
  for (const name of op.securitySchemes) {
    const header = detectAuthHeader(securitySchemes, name)
    if (header) return header
  }
  return op.securitySchemes.length ? "Bearer <your-token>" : null
}

function generateCurl(
  op: ParsedOperation,
  baseUrl: string,
  schemas: Record<string, SchemaObject>,
  securitySchemes: Record<string, SecuritySchemeObject>
): string {
  const fullPath = interpolatePath(op.path, op.parameters)
  const qs = buildQueryString(op.parameters)
  const url = `${baseUrl}${fullPath}${qs}`
  const method = op.method.toUpperCase()
  const auth = getAuthHeader(op, securitySchemes)

  const lines: string[] = [`curl -X ${method} '${url}'`]
  if (auth) lines.push(`  -H 'Authorization: ${auth}'`)
  if (op.requestBody) {
    lines.push(`  -H 'Content-Type: ${op.requestBody.contentType}'`)
    const body = generateExampleValue(op.requestBody.schema, schemas)
    lines.push(`  -d '${JSON.stringify(body, null, 2).replace(/'/g, "\\'")}'`)
  }

  return lines.join(" \\\n")
}

function generatePython(
  op: ParsedOperation,
  baseUrl: string,
  schemas: Record<string, SchemaObject>,
  securitySchemes: Record<string, SecuritySchemeObject>
): string {
  const fullPath = interpolatePath(op.path, op.parameters)
  const qs = buildQueryString(op.parameters)
  const url = `${baseUrl}${fullPath}${qs}`
  const method = op.method.toLowerCase()
  const auth = getAuthHeader(op, securitySchemes)

  const headers: Record<string, string> = {}
  if (auth) headers["Authorization"] = auth
  if (op.requestBody) headers["Content-Type"] = op.requestBody.contentType

  const headersStr = JSON.stringify(headers, null, 4).replace(/"([^"]+)":/g, '"$1":')
  const lines: string[] = ["import requests", ""]

  const args = [`\n    "${url}",`, `    headers=${headersStr},`]
  if (op.requestBody) {
    const body = generateExampleValue(op.requestBody.schema, schemas)
    args.push(`    json=${JSON.stringify(body, null, 4)},`)
  }

  lines.push(`response = requests.${method}(${args.join("\n")}\n)`)
  lines.push("print(response.json())")

  return lines.join("\n")
}

function generateJavaScript(
  op: ParsedOperation,
  baseUrl: string,
  schemas: Record<string, SchemaObject>,
  securitySchemes: Record<string, SecuritySchemeObject>
): string {
  const fullPath = interpolatePath(op.path, op.parameters)
  const qs = buildQueryString(op.parameters)
  const url = `${baseUrl}${fullPath}${qs}`
  const method = op.method.toUpperCase()
  const auth = getAuthHeader(op, securitySchemes)

  const headers: Record<string, string> = {}
  if (auth) headers["Authorization"] = auth
  if (op.requestBody) headers["Content-Type"] = op.requestBody.contentType

  const opts: string[] = [`  method: "${method}",`]
  if (Object.keys(headers).length) {
    opts.push(`  headers: ${JSON.stringify(headers, null, 4).split("\n").map((l, i) => (i === 0 ? l : "  " + l)).join("\n")},`)
  }
  if (op.requestBody) {
    const body = generateExampleValue(op.requestBody.schema, schemas)
    opts.push(`  body: JSON.stringify(${JSON.stringify(body, null, 4).split("\n").map((l, i) => (i === 0 ? l : "  " + l)).join("\n")}),`)
  }

  return [
    `const response = await fetch("${url}", {`,
    opts.join("\n"),
    "});",
    "const data = await response.json();",
    "console.log(data);",
  ].join("\n")
}

function generateGo(
  op: ParsedOperation,
  baseUrl: string,
  schemas: Record<string, SchemaObject>,
  securitySchemes: Record<string, SecuritySchemeObject>
): string {
  const fullPath = interpolatePath(op.path, op.parameters)
  const qs = buildQueryString(op.parameters)
  const url = `${baseUrl}${fullPath}${qs}`
  const method = op.method.toUpperCase()
  const auth = getAuthHeader(op, securitySchemes)
  const hasBody = !!op.requestBody

  const imports = ["fmt", "io", "net/http"]
  if (hasBody) imports.splice(1, 0, "bytes", "encoding/json")

  const lines: string[] = [
    "package main",
    "",
    "import (",
    ...imports.map((i) => `\t"${i}"`),
    ")",
    "",
    "func main() {",
  ]

  if (hasBody) {
    const body = generateExampleValue(op.requestBody!.schema, schemas)
    lines.push(`\tbody, _ := json.Marshal(${JSON.stringify(body)})`)
    lines.push(`\treq, _ := http.NewRequest("${method}", "${url}", bytes.NewBuffer(body))`)
  } else {
    lines.push(`\treq, _ := http.NewRequest("${method}", "${url}", nil)`)
  }

  if (auth) lines.push(`\treq.Header.Set("Authorization", "${auth}")`)
  if (hasBody) lines.push(`\treq.Header.Set("Content-Type", "${op.requestBody!.contentType}")`)

  lines.push(
    "",
    "\tresp, _ := http.DefaultClient.Do(req)",
    "\tdefer resp.Body.Close()",
    "\tbody2, _ := io.ReadAll(resp.Body)",
    "\tfmt.Println(string(body2))",
    "}"
  )

  return lines.join("\n")
}

function generateCodeSamples(
  op: ParsedOperation,
  baseUrl: string,
  schemas: Record<string, SchemaObject>,
  securitySchemes: Record<string, SecuritySchemeObject>,
  languages: string[]
): CodeSample[] {
  const generators: Record<string, () => string> = {
    curl: () => generateCurl(op, baseUrl, schemas, securitySchemes),
    python: () => generatePython(op, baseUrl, schemas, securitySchemes),
    javascript: () => generateJavaScript(op, baseUrl, schemas, securitySchemes),
    go: () => generateGo(op, baseUrl, schemas, securitySchemes),
  }

  return languages.flatMap((lang) => {
    const gen = generators[lang.toLowerCase()]
    if (!gen) return []
    return [{ lang, source: gen() }]
  })
}

// ---- OpenAPI parser ----

const HTTP_METHODS: HttpMethod[] = ["get", "post", "put", "delete", "patch", "head", "options"]

function parseOperation(
  method: HttpMethod,
  urlPath: string,
  rawOp: Record<string, unknown>,
  globalSecurity: Array<Record<string, unknown>>,
  schemas: Record<string, SchemaObject>,
  securitySchemes: Record<string, SecuritySchemeObject>,
  languages: string[]
): ParsedOperation {
  const tags = (rawOp.tags as string[] | undefined) ?? ["default"]
  const tag = tags[0]
  const operationId = (rawOp.operationId as string | undefined) ??
    `${method}-${urlPath.replace(/\//g, "-").replace(/[{}]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "")}`

  const rawParams = (rawOp.parameters as Record<string, unknown>[] | undefined) ?? []
  const parameters: ParsedParameter[] = rawParams.map((p) => ({
    name: p.name as string,
    in: p.in as ParsedParameter["in"],
    description: p.description as string | undefined,
    required: (p.required as boolean | undefined) ?? (p.in === "path"),
    schema: (p.schema as SchemaObject | undefined) ?? { type: "string" },
    example: p.example,
    deprecated: p.deprecated as boolean | undefined,
  }))

  let requestBody: ParsedRequestBody | undefined
  const rawBody = rawOp.requestBody as Record<string, unknown> | undefined
  if (rawBody) {
    const content = rawBody.content as Record<string, Record<string, unknown>> | undefined
    const contentType = content ? Object.keys(content)[0] : "application/json"
    const mediaType = content?.[contentType] ?? {}
    requestBody = {
      description: rawBody.description as string | undefined,
      required: (rawBody.required as boolean | undefined) ?? false,
      contentType,
      schema: (mediaType.schema as SchemaObject | undefined) ?? {},
    }
  }

  const rawResponses = (rawOp.responses as Record<string, Record<string, unknown>> | undefined) ?? {}
  const responses: ParsedResponse[] = Object.entries(rawResponses).map(([code, resp]) => {
    const content = resp.content as Record<string, Record<string, unknown>> | undefined
    const contentType = content ? Object.keys(content)[0] : undefined
    const schema = contentType ? (content?.[contentType]?.schema as SchemaObject | undefined) : undefined
    return {
      statusCode: code,
      description: (resp.description as string | undefined) ?? "",
      contentType,
      schema,
    }
  })

  const rawSecurity = (rawOp.security as Array<Record<string, unknown>> | undefined) ?? globalSecurity
  const securitySchemeNames = rawSecurity.flatMap((req) => Object.keys(req))

  const rawCodeSamples = rawOp["x-codeSamples"] as Array<{ lang: string; label?: string; source: string }> | undefined
  const codeSamples = rawCodeSamples?.length
    ? rawCodeSamples
    : generateCodeSamples(
        { tag, tagSlug: slugify(tag), operationId, summary: "", method, path: urlPath, parameters, requestBody, responses, securitySchemes: securitySchemeNames, codeSamples: [], deprecated: false },
        "",
        schemas,
        securitySchemes,
        languages
      )

  return {
    tag,
    tagSlug: slugify(tag),
    operationId,
    summary: (rawOp.summary as string | undefined) ?? operationId,
    description: rawOp.description as string | undefined,
    method,
    path: urlPath,
    parameters,
    requestBody,
    responses,
    securitySchemes: securitySchemeNames,
    codeSamples,
    deprecated: rawOp.deprecated as boolean | undefined,
  }
}

function parseOpenApi(doc: Record<string, unknown>, configLanguages?: string[]): ParsedSpec {
  const info = (doc.info as Record<string, unknown>) ?? {}
  const servers = (doc.servers as Array<{ url: string; description?: string }> | undefined) ?? []
  const baseUrl = servers[0]?.url ?? ""
  const rawTags = (doc.tags as Array<{ name: string; description?: string }> | undefined) ?? []
  const components = (doc.components as Record<string, unknown>) ?? {}
  const schemas = ((components.schemas as Record<string, SchemaObject>) ?? {})
  const securitySchemes = ((components.securitySchemes as Record<string, SecuritySchemeObject>) ?? {})
  const globalSecurity = (doc.security as Array<Record<string, unknown>> | undefined) ?? []

  const specLanguages = (doc as Record<string, unknown>)["x-languages"] as string[] | undefined
  const languages = configLanguages ?? specLanguages ?? ["curl", "python", "javascript", "go"]

  const paths = (doc.paths as Record<string, Record<string, unknown>>) ?? {}
  const allOperations: ParsedOperation[] = []

  for (const [urlPath, pathItem] of Object.entries(paths)) {
    for (const method of HTTP_METHODS) {
      const rawOp = pathItem[method] as Record<string, unknown> | undefined
      if (!rawOp) continue
      const op = parseOperation(method, urlPath, rawOp, globalSecurity, schemas, securitySchemes, languages)
      // Re-generate code samples now that we have the base URL
      if (!(rawOp["x-codeSamples"])) {
        op.codeSamples = generateCodeSamples(op, baseUrl, schemas, securitySchemes, languages)
      }
      allOperations.push(op)
    }
  }

  // Build tag map — preserve order from spec tags, then append any unmentioned tags
  const tagOrder = rawTags.map((t) => t.name)
  const allTagNames = [...new Set([...tagOrder, ...allOperations.map((o) => o.tag)])]

  const tagDescMap = Object.fromEntries(rawTags.map((t) => [t.name, t.description]))

  const tags: ParsedTag[] = allTagNames.map((name) => ({
    name,
    slug: slugify(name),
    description: tagDescMap[name],
    operations: allOperations.filter((o) => o.tag === name),
  })).filter((t) => t.operations.length > 0)

  return {
    info: {
      title: (info.title as string) ?? "API Reference",
      version: (info.version as string) ?? "v1",
      description: info.description as string | undefined,
    },
    baseUrl,
    tags,
    allOperations,
    schemas,
    securitySchemes,
  }
}
