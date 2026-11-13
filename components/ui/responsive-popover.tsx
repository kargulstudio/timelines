"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@/lib/utils"
import { BREAKPOINTS, useMediaQuery } from "@/lib/use-media-query"
import {
  Popover as DesktopPopover,
  PopoverContent as DesktopPopoverContent,
  PopoverTrigger as DesktopPopoverTrigger,
} from "./popover"

/**
 * Drop-in for Popover / PopoverTrigger / PopoverContent that becomes a
 * bottom sheet (a modal Base UI Dialog) below the md breakpoint, so editors
 * and details stay thumb-reachable on phones. Same API as ./popover.
 */
const SheetContext = React.createContext(false)

type RootProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

function Popover({ open, defaultOpen, onOpenChange, children }: RootProps) {
  const isSheet = !useMediaQuery(BREAKPOINTS.md)
  return (
    <SheetContext.Provider value={isSheet}>
      {isSheet ? (
        <DialogPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={(o) => onOpenChange?.(o)}>
          {children}
        </DialogPrimitive.Root>
      ) : (
        <DesktopPopover open={open} defaultOpen={defaultOpen} onOpenChange={(o) => onOpenChange?.(o)}>
          {children}
        </DesktopPopover>
      )}
    </SheetContext.Provider>
  )
}

function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  const isSheet = React.useContext(SheetContext)
  if (isSheet) return <DialogPrimitive.Trigger data-slot="popover-trigger" {...(props as DialogPrimitive.Trigger.Props)} />
  return <DesktopPopoverTrigger {...props} />
}

type ContentProps = React.ComponentProps<typeof DesktopPopoverContent> & {
  /** accessible name for the sheet (popovers are named by their trigger) */
  title?: string
}

function PopoverContent({
  className,
  children,
  title,
  anchor,
  align,
  alignOffset,
  side,
  sideOffset,
  collisionPadding,
  initialFocus,
  finalFocus,
  ...props
}: ContentProps) {
  const isSheet = React.useContext(SheetContext)
  if (!isSheet) {
    return (
      <DesktopPopoverContent
        className={className}
        anchor={anchor}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        {...props}
      >
        {children}
      </DesktopPopoverContent>
    )
  }
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-(--bg-overlay) transition-opacity duration-(--duration-slow) ease-out-strong",
          "data-starting-style:opacity-0 data-ending-style:opacity-0"
        )}
      />
      <DialogPrimitive.Popup
        data-slot="popover-content"
        data-sheet=""
        initialFocus={initialFocus as DialogPrimitive.Popup.Props["initialFocus"]}
        finalFocus={finalFocus as DialogPrimitive.Popup.Props["finalFocus"]}
        {...(props as DialogPrimitive.Popup.Props)}
        className={cn(
          "flex flex-col gap-2.5 text-sm text-popover-foreground outline-hidden",
          className,
          // bottom sheet: full width, rounded top, safe-area padding, slides on the drawer curve
          "fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-2xl rounded-b-none bg-popover",
          "px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0px_-8px_32px_-8px_rgba(9,9,11,0.24)]",
          "transition-transform duration-300 ease-drawer data-starting-style:translate-y-full data-ending-style:translate-y-full"
        )}
      >
        <span aria-hidden className="mx-auto mb-1 h-1 w-9 shrink-0 rounded-full bg-[#e2e2e2]" />
        {title && <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>}
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

/** true inside a ResponsivePopover rendered as a bottom sheet */
function useIsSheet() {
  return React.useContext(SheetContext)
}

export { Popover, PopoverTrigger, PopoverContent, useIsSheet }
