import Link from "next/link"
import type { ParsedSpec } from "@/lib/api-types"
import { MethodBadge } from "./MethodBadge"

type Props = {
  spec: ParsedSpec
  base?: string
}

export function ApiOverview({ spec, base = "/api-reference" }: Props) {
  return (
    <div className="flex-1 px-8 py-8 max-w-4xl overflow-y-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{spec.info.title}</h1>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
          {spec.info.version}
        </span>
        {spec.baseUrl && (
          <code className="text-xs text-gray-500 dark:text-gray-400">{spec.baseUrl}</code>
        )}
      </div>

      {spec.info.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-10 leading-relaxed whitespace-pre-line max-w-2xl">
          {spec.info.description}
        </p>
      )}

      {/* Tag groups */}
      <div className="space-y-8">
        {spec.tags.map((tag) => (
          <section key={tag.slug}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{tag.name}</h2>
            {tag.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{tag.description}</p>
            )}

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              {tag.operations.map((op) => (
                <Link
                  key={op.operationId}
                  href={`${base}/${tag.slug}/${op.operationId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group"
                >
                  <MethodBadge method={op.method} size="sm" />
                  <code className="text-sm font-mono text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 flex-1">
                    {op.path}
                  </code>
                  <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                    {op.summary}
                  </span>
                  {op.deprecated && (
                    <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wide">deprecated</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
