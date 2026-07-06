import type { ParsedOperation, ParsedSpec } from "@/lib/api-types"
import { MethodBadge } from "./MethodBadge"
import { ParamsTable } from "./ParamsTable"
import { SchemaViewer } from "./SchemaViewer"
import { ResponseDocs } from "./ResponseDocs"
import { CodeSamples } from "./CodeSamples"
import { ResponseExample } from "./ResponseExample"
import { ResponseProvider } from "./ResponseContext"

type Props = {
  operation: ParsedOperation
  spec: ParsedSpec
}

export function EndpointPage({ operation: op, spec }: Props) {
  const defaultCode =
    op.responses.find((r) => r.statusCode.startsWith("2") && r.schema)?.statusCode ?? null

  return (
    <ResponseProvider defaultCode={defaultCode}>
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Full-width header — title + method + path on their own row */}
        <div className="px-8 pt-8 pb-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-3">{op.summary}</h1>
          <div className="flex items-center gap-3">
            <MethodBadge method={op.method} />
            <code className="text-sm font-mono text-gray-600 dark:text-gray-400">
              {op.path}
            </code>
            {op.deprecated && (
              <span className="text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded">
                deprecated
              </span>
            )}
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left: description, params, request body, responses */}
          <div className="flex-1 px-8 py-6 min-w-0 max-w-2xl overflow-y-auto">
            {op.description && (
              <div className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed whitespace-pre-line">
                {op.description}
              </div>
            )}

            <ParamsTable parameters={op.parameters} schemas={spec.schemas} group="path" />
            <ParamsTable parameters={op.parameters} schemas={spec.schemas} group="query" />
            <ParamsTable parameters={op.parameters} schemas={spec.schemas} group="header" />

            {op.requestBody && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Request Body
                  </h3>
                  {op.requestBody.required && (
                    <span className="text-[10px] font-medium text-red-500 uppercase tracking-wide">required</span>
                  )}
                </div>
                {op.requestBody.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{op.requestBody.description}</p>
                )}
                <p className="text-xs font-mono text-gray-400 mb-3">{op.requestBody.contentType}</p>
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-2">
                  <SchemaViewer schema={op.requestBody.schema} schemas={spec.schemas} />
                </div>
              </section>
            )}

            <ResponseDocs responses={op.responses} schemas={spec.schemas} />
          </div>

          {/* Right: code samples + interactive response example */}
          <div className="hidden xl:flex flex-col w-[520px] shrink-0 overflow-y-auto">
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                Request
              </p>
              <CodeSamples samples={op.codeSamples} />
              <ResponseExample responses={op.responses} schemas={spec.schemas} />
            </div>
          </div>

        </div>
      </div>
    </ResponseProvider>
  )
}
