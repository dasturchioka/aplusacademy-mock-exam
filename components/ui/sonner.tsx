"use client"

import { useEffect, useState } from "react"
import { Toaster as Sonner, ToasterProps } from "sonner"

function getBodyTheme(): ToasterProps["theme"] {
  if (typeof document === "undefined") {
    return "light"
  }

  if (document.body.classList.contains("dark")) {
    return "dark"
  }

  return localStorage.getItem("theme") === "dark" ? "dark" : "light"
}

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<ToasterProps["theme"]>(getBodyTheme)

  useEffect(() => {
    const body = document.body
    const observer = new MutationObserver(() => {
      setTheme(body.classList.contains("dark") ? "dark" : "light")
    })

    observer.observe(body, { attributes: true, attributeFilter: ["class"] })

    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
