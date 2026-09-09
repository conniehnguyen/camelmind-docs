"use client"

import { useState } from "react"
import { resolveRef } from "@/lib/api-utils"
import type { SchemaObject } from "@/lib/api-types"

// Correctly merges allOf items: shallow-merges scalar fields but additively merges
// `properties` and `required` so no allOf item's fields are lost.
function mergeAllOf(allOf: SchemaObject[], schemas: Record<string, SchemaObject>): SchemaObject {
  const items = allOf.map((s) => (s.$ref ? (resolveRef(s.$ref, schemas) ?? s) : s))
  const merged = Object.assign({} as SchemaObject, ...items)
  const mergedProps: Record<string, SchemaObject> = {}
  const mergedRequired: string[] = []
  for (const item of items) {
    if (item.properties) Object.assign(mergedProps, item.properties)
    if (item.required) mergedRequired.push(...item.required)
  }
  if (Object.keys(mergedProps).length) merged.properties = mergedProps
  if (mergedRequired.length) merged.required = [...new Set(mergedRequired)]
  return merged
}

type Props = {
  schema: SchemaObject
  schemas: Record<string, SchemaObject>
  required?: boolean
  name?: string
  depth?: number
}

function TypeLabel({ schema }: { schema: SchemaObject }) {
  if (schema.$ref) {
    const refName = schema.$ref.replace("#/components/schemas/", "")
    return <span className="text-xs font-mono text-purple-600 dark:text-purple-400">{refName}</span>
  }

  if (schema.allOf?.length) {
    return <span className="text-xs font-mono text-gray-500">object</span>
  }

  if (schema.type === "array") {
    const items = schema.items
    if (items?.$ref) {
      const refName = items.$ref.replace("#/components/schemas/", "")
      return <span className="text-xs font-mono text-gray-500">array of <span className="text-purple-600 dark:text-purple-400">{refName}</span></span>
    }
    return <span className="text-xs font-mono text-gray-500">array{items?.type ? ` of ${items.type}` : ""}</span>
  }

  if (schema.enum) {
    return (
      <span className="text-xs font-mono text-gray-500">
        {schema.type ?? "string"}{" "}
        <span className="text-gray-400">({schema.enum.map((v) => JSON.stringify(v)).join(" | ")})</span>
      </span>
    )
  }

  if (schema.format) {
    return <span className="text-xs font-mono text-gray-500">{schema.type} <span className="text-gray-400">({schema.format})</span></span>
  }

  return <span className="text-xs font-mono text-gray-500">{schema.type ?? "any"}</span>
}

function PropertyRow({
  name,
  schema,
  required,
  schemas,
  depth,
}: {
  name: string
  schema: SchemaObject
  required: boolean
  schemas: Record<string, SchemaObject>
  depth: number
}) {
  const [expanded, setExpanded] = useState(depth < 1)

  const resolved: SchemaObject = schema.$ref ? (resolveRef(schema.$ref, schemas) ?? schema) : schema
  const mergedSchema: SchemaObject = resolved.allOf?.length
    ? mergeAllOf(resolved.allOf, schemas)
    : resolved

  const itemSchema = mergedSchema.type === "array" && mergedSchema.items
    ? (mergedSchema.items.$ref ? (resolveRef(mergedSchema.items.$ref, schemas) ?? mergedSchema.items) : mergedSchema.items)
    : null

  const childProperties =
    mergedSchema.type === "object" || mergedSchema.properties
      ? mergedSchema.properties
      : itemSchema?.type === "object" || itemSchema?.properties
        ? itemSchema.properties
        : null

  const hasChildren = depth < 4 && !!childProperties && Object.keys(childProperties).length > 0

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-start gap-3 py-3 px-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{name}</code>
            <TypeLabel schema={schema} />
            {required && (
              <span className="text-[10px] font-medium text-red-500 uppercase tracking-wide">required</span>
            )}
            {(resolved.readOnly || mergedSchema.readOnly) && (
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">read-only</span>
            )}
            {(schema.deprecated || resolved.deprecated) && (
              <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wide">deprecated</span>
            )}
          </div>
          {(resolved.description || mergedSchema.description) && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {resolved.description ?? mergedSchema.description}
            </p>
          )}
          {resolved.default !== undefined && (
            <p className="text-xs text-gray-400 mt-0.5">
              Default: <code className="font-mono">{JSON.stringify(resolved.default)}</code>
            </p>
          )}
        </div>

        {hasChildren && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="shrink-0 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 mt-0.5"
          >
            {expanded ? "Hide" : "Show"} fields
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-0" : "rotate-180"}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="ml-4 border-l-2 border-gray-100 dark:border-gray-800 pl-4 mb-3">
          {(Object.entries(childProperties!) as [string, SchemaObject][]).map(([childName, childSchema]) => (
            <PropertyRow
              key={childName}
              name={childName}
              schema={childSchema}
              required={(mergedSchema.required ?? itemSchema?.required ?? []).includes(childName)}
              schemas={schemas}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function SchemaViewer({ schema, schemas, required, name, depth = 0 }: Props) {
  const resolved: SchemaObject = schema.$ref ? (resolveRef(schema.$ref, schemas) ?? schema) : schema
  const mergedSchema: SchemaObject = resolved.allOf?.length
    ? mergeAllOf(resolved.allOf, schemas)
    : resolved

  const properties = mergedSchema.properties
  const requiredFields = mergedSchema.required ?? []

  if (name !== undefined) {
    return (
      <PropertyRow
        name={name}
        schema={schema}
        required={required ?? false}
        schemas={schemas}
        depth={depth}
      />
    )
  }

  if (!properties || Object.keys(properties).length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
        <TypeLabel schema={schema} />
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {(Object.entries(properties) as [string, SchemaObject][]).map(([propName, propSchema]) => (
        <PropertyRow
          key={propName}
          name={propName}
          schema={propSchema}
          required={requiredFields.includes(propName)}
          schemas={schemas}
          depth={depth}
        />
      ))}
    </div>
  )
}
