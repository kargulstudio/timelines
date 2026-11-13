import { cn } from "@/lib/utils"

type FigmaIconProps = {
  /** path under /public, e.g. /figma/icons/plus.svg */
  src: string
  /** rendered box in px (Figma icon frames are 14×14 unless noted) */
  size?: number
  className?: string
  alt?: string
}

/**
 * Exact Figma-exported SVG/PNG asset. Static files from /public, so a plain
 * <img> is the right primitive (no optimisation pipeline needed for SVGs).
 */
export function FigmaIcon({ src, size = 14, className, alt = "" }: FigmaIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      aria-hidden={alt === "" ? true : undefined}
      className={cn("block shrink-0 select-none", className)}
      style={{ width: size, height: size }}
    />
  )
}

/** 1×16 vertical divider (#E6E6E6, r=2) used throughout the toolbar and chips. */
export function VDivider({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block h-4 w-px shrink-0 rounded-[2px] bg-(--tl-divider)", className)} />
}
