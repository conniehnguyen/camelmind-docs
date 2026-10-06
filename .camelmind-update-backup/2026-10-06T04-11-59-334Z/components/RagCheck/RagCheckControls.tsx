"use client"

type Props = {
  chunkSize: number
  chunkOverlap: number
  running: boolean
  onChunkSizeChange: (value: number) => void
  onChunkOverlapChange: (value: number) => void
  onRun: () => void
  onExport: () => void
  hasResult: boolean
}

const OVERLAP_PRESETS = [0, 50, 80, 100, 150]
const SIZE_PRESETS = [300, 500, 800]

export function RagCheckControls({
  chunkSize,
  chunkOverlap,
  running,
  onChunkSizeChange,
  onChunkOverlapChange,
  onRun,
  onExport,
  hasResult,
}: Props) {
  return (
    <div className="space-y-4 p-4 border-b border-gray-200 dark:border-gray-800">
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chunk size</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {SIZE_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onChunkSizeChange(size)}
              className={`px-2 py-1 text-xs rounded border ${
                chunkSize === size
                  ? "border-gray-900 dark:border-gray-100 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {size}
            </button>
          ))}
          <input
            type="number"
            min={100}
            max={4000}
            value={chunkSize}
            onChange={(e) => onChunkSizeChange(Number(e.target.value))}
            className="w-20 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-transparent"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chunk overlap</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {OVERLAP_PRESETS.map((overlap) => (
            <button
              key={overlap}
              type="button"
              onClick={() => onChunkOverlapChange(overlap)}
              className={`px-2 py-1 text-xs rounded border ${
                chunkOverlap === overlap
                  ? "border-gray-900 dark:border-gray-100 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {overlap}
            </button>
          ))}
          <input
            type="number"
            min={0}
            max={500}
            value={chunkOverlap}
            onChange={(e) => onChunkOverlapChange(Number(e.target.value))}
            className="w-20 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-transparent"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="flex-1 px-4 py-2 text-sm font-medium rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 disabled:opacity-50"
        >
          {running ? "Running..." : "Run check"}
        </button>
        {hasResult && (
          <button
            type="button"
            onClick={onExport}
            className="px-4 py-2 text-sm font-medium rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
          >
            Export JSON
          </button>
        )}
      </div>
    </div>
  )
}
