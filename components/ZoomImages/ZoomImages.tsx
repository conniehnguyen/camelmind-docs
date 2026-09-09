"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function ZoomImages() {
  const pathname = usePathname()
  const [zoomedSrc, setZoomedSrc] = useState<string | null>(null)
  const [zoomedAlt, setZoomedAlt] = useState("")

  useEffect(() => {
    const article = document.querySelector("article")
    if (!article) return

    const imgs = Array.from(article.querySelectorAll<HTMLImageElement>("img"))

    function onClick(this: HTMLImageElement) {
      setZoomedSrc(this.src)
      setZoomedAlt(this.alt)
    }

    imgs.forEach((img) => img.addEventListener("click", onClick))
    return () => imgs.forEach((img) => img.removeEventListener("click", onClick))
  }, [pathname])

  useEffect(() => {
    setZoomedSrc(null)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = zoomedSrc ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [zoomedSrc])

  useEffect(() => {
    if (!zoomedSrc) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomedSrc(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [zoomedSrc])

  if (!zoomedSrc) return null

  return (
    <div className="image-zoom-overlay" onClick={() => setZoomedSrc(null)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={zoomedSrc} alt={zoomedAlt} className="image-zoom-overlay-img" />
    </div>
  )
}
