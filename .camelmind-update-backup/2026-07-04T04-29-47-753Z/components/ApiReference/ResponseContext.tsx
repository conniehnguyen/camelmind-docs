"use client"

import { createContext, useContext, useState } from "react"

type ResponseContextValue = {
  selectedCode: string | null
  setSelectedCode: (code: string | null) => void
}

const ResponseContext = createContext<ResponseContextValue>({
  selectedCode: null,
  setSelectedCode: () => {},
})

export function ResponseProvider({
  children,
  defaultCode,
}: {
  children: React.ReactNode
  defaultCode: string | null
}) {
  const [selectedCode, setSelectedCode] = useState<string | null>(defaultCode)
  return (
    <ResponseContext.Provider value={{ selectedCode, setSelectedCode }}>
      {children}
    </ResponseContext.Provider>
  )
}

export function useResponseContext() {
  return useContext(ResponseContext)
}
