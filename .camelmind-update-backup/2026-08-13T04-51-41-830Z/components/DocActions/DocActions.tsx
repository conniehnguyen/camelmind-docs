"use client"

import { FileText, Download } from "lucide-react"

type Props = {
  file: string
  downloadPdf?: string
  offline?: boolean
}

export function DocActions({ file, downloadPdf, offline }: Props) {
  // In offline builds, /api/raw doesn't exist — only show PDF download if present
  if (offline) {
    if (!downloadPdf) return null
    return (
      <div className="flex items-center gap-5 mb-6 pb-5 border-b border-gray-200">
        <a
          href={downloadPdf}
          download
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          <Download size={14} />
          Download PDF
        </a>
      </div>
    )
  }

  const rawBase = `/api/raw?file=${encodeURIComponent(file)}`

  return (
    <div className="flex items-center gap-5 mb-6 pb-5 border-b border-gray-200">
      <a
        href={rawBase}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        <FileText size={14} />
        View as Markdown
      </a>
      <a
        href={`${rawBase}&download=1`}
        download
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        <Download size={14} />
        Download Markdown
      </a>
      {downloadPdf && (
        <a
          href={downloadPdf}
          download
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          <Download size={14} />
          Download PDF
        </a>
      )}
    </div>
  )
}
