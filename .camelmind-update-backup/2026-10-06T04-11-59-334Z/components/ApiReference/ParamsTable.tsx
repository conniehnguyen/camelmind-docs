import type { ParsedParameter, SchemaObject } from "@/lib/api-types"
import { SchemaViewer } from "./SchemaViewer"

type Props = {
  parameters: ParsedParameter[]
  schemas: Record<string, SchemaObject>
  group: "path" | "query" | "header"
}

const GROUP_LABELS: Record<string, string> = {
  path:   "Path Parameters",
  query:  "Query Parameters",
  header: "Header Parameters",
}

function TypeTag({ schema }: { schema: SchemaObject }) {
  if (schema.enum) {
    return (
      <span className="text-xs font-mono text-gray-500">
        {schema.type ?? "string"}{" "}
        <span className="text-gray-400 text-[11px]">
          ({schema.enum.map((v) => JSON.stringify(v)).join(" | ")})
        </span>
      </span>
    )
  }
  if (schema.format) {
    return <span className="text-xs font-mono text-gray-500">{schema.type} ({schema.format})</span>
  }
  return <span className="text-xs font-mono text-gray-500">{schema.type ?? "string"}</span>
}

export function ParamsTable({ parameters, schemas, group }: Props) {
  const filtered = parameters.filter((p) => p.in === group)
  if (!filtered.length) return null

  return (
    <section className="mb-8">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
        {GROUP_LABELS[group]}
      </h3>
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        {filtered.map((param) => (
          <div key={param.name} className="px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <code className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                {param.name}
              </code>
              <TypeTag schema={param.schema} />
              {param.required && (
                <span className="text-[10px] font-medium text-red-500 uppercase tracking-wide">required</span>
              )}
              {param.deprecated && (
                <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wide">deprecated</span>
              )}
            </div>
            {param.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{param.description}</p>
            )}
            {param.schema.default !== undefined && (
              <p className="text-xs text-gray-400 mt-0.5">
                Default: <code className="font-mono">{JSON.stringify(param.schema.default)}</code>
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
