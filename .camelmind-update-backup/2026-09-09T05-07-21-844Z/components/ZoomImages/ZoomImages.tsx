"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function ZoomImages() {
  const pathname = usePathname()

  useEffect(() => {
    const article = document.querySelector("article")
    if (!article) return

    const imgs = Array.from(article.querySelectorAll<HTMLImageElement>("img"))

    function toggle(this: HTMLImageElement) {
      this.classList.toggle("zoomed")
    }

    imgs.forEach((img) => img.addEventListener("click", toggle))
    return () => imgs.forEach((img) => img.removeEventListener("click", toggle))
  }, [pathname])

  return null
}
