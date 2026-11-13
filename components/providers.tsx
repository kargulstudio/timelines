"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { BREAKPOINTS, useMediaQuery } from "@/lib/use-media-query"

export function Providers({ children }: { children: ReactNode }) {
  // phones: toasts drop from the top so they never cover bottom sheets or the thumb zone
  const isPhone = !useMediaQuery(BREAKPOINTS.md)
  return (
    // Always light (matches Figma). forcedTheme also overrides any "dark" saved earlier.
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
      {/* First tooltip waits 400ms; neighbours open instantly (Base UI provider). */}
      <TooltipProvider delay={400} closeDelay={0}>
        {children}
        <Toaster position={isPhone ? "top-center" : "bottom-right"} />
      </TooltipProvider>
    </ThemeProvider>
  )
}
