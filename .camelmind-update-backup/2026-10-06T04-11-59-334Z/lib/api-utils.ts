import type { SchemaObject } from "./api-types"

export function resolveRef(
  ref: string,
  schemas: Record<string, SchemaObject>
): SchemaObject | null {
  const match = ref.match(/^#\/components\/schemas\/(.+)$/)
  if (!match) return null
  return schemas[match[1]] ?? null
}

// Shared example builder — used by both left-panel schema docs and right-panel response examples
export function buildExample(
  schema: SchemaObject,
  schemas: Record<string, SchemaObject>,
  depth = 0
): unknown {
  if (depth > 5) return {}

  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, schemas)
    return resolved ? buildExample(resolved, schemas, depth + 1) : {}
  }

  if (schema.allOf?.length) {
    const merged: Record<string, unknown> = {}
    for (const sub of schema.allOf) {
      const val = buildExample(sub, schemas, depth + 1)
      if (typeof val === "object" && val !== null) Object.assign(merged, val)
    }
    return merged
  }

  if (schema.type === "array") {
    const item = schema.items ? buildExample(schema.items, schemas, depth + 1) : "string"
    return [item]
  }

  if (schema.type === "object" || schema.properties) {
    const obj: Record<string, unknown> = {}
    for (const [key, prop] of Object.entries(schema.properties ?? {}) as [string, SchemaObject][]) {
      if (prop.example !== undefined) { obj[key] = prop.example; continue }
      if (prop.default !== undefined) { obj[key] = prop.default; continue }
      obj[key] = buildExample(prop, schemas, depth + 1)
    }
    return obj
  }

  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default
  if (schema.enum?.length) return schema.enum[0]
  if (schema.type === "string") {
    if (schema.format === "date-time") return "2024-01-15T10:30:00Z"
    if (schema.format === "date") return "2024-01-15"
    if (schema.format === "uuid") return "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    if (schema.format === "email") return "user@example.com"
    return "string"
  }
  if (schema.type === "integer" || schema.type === "number") return 0
  if (schema.type === "boolean") return true
  return null
}
