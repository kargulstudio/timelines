"use client"

import { useCallback, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/responsive-popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DAYS, DAY_NAMES, type Employee, type Shift, type ShiftWarning } from "@/lib/data"
import { formatHours, shiftHours } from "@/lib/schedule"

export function shiftDayRange(shift: Shift, long = false) {
  const names = long ? DAY_NAMES : DAYS
  return shift.start === shift.end ? names[shift.start] : `${names[shift.start]} – ${names[shift.end]}`
}

type ShiftBarProps = {
  shift: Shift
  employee: Employee
  row: number
  accent: string
  warning?: ShiftWarning
  /** highlight mode currently active in the toolbar */
  flagged: boolean
  onRemove: (shift: Shift) => void
  onResolve: (shiftId: string) => void
  /** open the shift editor anchored to this bar */
  onEdit: (shift: Shift, anchor: HTMLElement) => void
  /** whether the shift may occupy these days (no other shift, day off or sick day) */
  canPlace: (shift: Shift, start: number, end: number) => boolean
  /** commit a move / resize */
  onMove: (shift: Shift, start: number, end: number) => void
}

type DragMode = "move" | "start" | "end"
type Drag = {
  mode: DragMode
  pointerId: number
  x0: number
  y0: number
  col: number
  touch: boolean
  active: boolean
  timer?: ReturnType<typeof setTimeout>
}

/** Long-press before a touch drag starts, so a plain swipe still scrolls the grid. */
const TOUCH_HOLD_MS = 320

/**
 * Figma shift bar (e.g. 1:10363): 30px, r-7, accent tint at 6% over white,
 * 1px accent ring at 14%, Inter Medium 14 centred. Placed on the CSS grid by day.
 */
export function ShiftBar({
  shift,
  employee,
  row,
  accent,
  warning,
  flagged,
  onRemove,
  onResolve,
  onEdit,
  canPlace,
  onMove,
}: ShiftBarProps) {
  const [open, setOpen] = useState(false)
  const barRef = useRef<HTMLButtonElement>(null)

  /* ------------------------------ drag ------------------------------- */
  const drag = useRef<Drag | null>(null)
  const suppressClick = useRef(false)
  const [preview, setPreview] = useState<{ start: number; end: number } | null>(null)
  const [dragMode, setDragMode] = useState<DragMode | null>(null)
  const start = preview?.start ?? shift.start
  const end = preview?.end ?? shift.end

  // While a touch drag is live, stop the browser from turning the gesture into a scroll.
  // A ref callback (not an effect) so it follows the element when the trigger remounts
  // (the popover swaps to a bottom sheet on phones).
  const setBarRef = useCallback((el: HTMLButtonElement | null) => {
    barRef.current = el
    if (!el) return
    const block = (e: TouchEvent) => {
      if (drag.current?.active) e.preventDefault()
    }
    el.addEventListener("touchmove", block, { passive: false })
    return () => el.removeEventListener("touchmove", block)
  }, [])

  function activate(d: Drag, el: HTMLElement) {
    d.active = true
    setDragMode(d.mode)
    setOpen(false)
    try {
      el.setPointerCapture(d.pointerId)
    } catch {}
    if (d.touch) navigator.vibrate?.(8)
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return
    const grid = e.currentTarget.parentElement
    if (!grid) return
    const handle = (e.target as HTMLElement).closest<HTMLElement>("[data-handle]")?.dataset.handle as DragMode | undefined
    const d: Drag = {
      mode: handle ?? "move",
      pointerId: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      col: grid.getBoundingClientRect().width / 7,
      touch: e.pointerType !== "mouse",
      active: false,
    }
    drag.current = d
    if (!d.touch) {
      // follow the mouse even once it leaves the bar (touch pointers are captured implicitly)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {}
    } else {
      const el = e.currentTarget
      d.timer = setTimeout(() => drag.current === d && activate(d, el), TOUCH_HOLD_MS)
    }
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current
    if (!d || e.pointerId !== d.pointerId) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (!d.active) {
      if (d.touch) {
        // moved before the long-press fired → it's a scroll, not a drag
        if (Math.hypot(dx, dy) > 8) endDrag(false)
        return
      }
      if (Math.abs(dx) < 4) return
      activate(d, e.currentTarget)
    }
    const delta = Math.round(dx / d.col)
    let s: number = shift.start
    let en: number = shift.end
    if (d.mode === "move") {
      const len = shift.end - shift.start
      s = Math.min(Math.max(shift.start + delta, 0), 6 - len)
      en = s + len
    } else if (d.mode === "start") {
      s = Math.min(Math.max(shift.start + delta, 0), shift.end)
    } else {
      en = Math.max(Math.min(shift.end + delta, 6), shift.start)
    }
    // snap to day columns; a blocked target keeps the last valid spot (the bar stops at the obstacle)
    if ((s !== start || en !== end) && canPlace(shift, s, en)) setPreview({ start: s, end: en })
  }

  function endDrag(commit: boolean) {
    const d = drag.current
    if (d?.timer) clearTimeout(d.timer)
    drag.current = null
    if (d?.active) {
      suppressClick.current = true
      setTimeout(() => (suppressClick.current = false), 0)
      if (commit && preview && (preview.start !== shift.start || preview.end !== shift.end)) {
        onMove(shift, preview.start, preview.end)
      }
    }
    setPreview(null)
    setDragMode(null)
  }

  /* ---------------------------- keyboard ----------------------------- */
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault()
      onRemove(shift)
      return
    }
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    const step = e.key === "ArrowLeft" ? -1 : 1
    let s: number = shift.start
    let en: number = shift.end
    if (e.shiftKey) en = Math.max(shift.start, Math.min(6, shift.end + step))
    else {
      s += step
      en += step
    }
    if (s < 0 || en > 6 || (s === shift.start && en === shift.end)) return
    if (canPlace(shift, s, en)) onMove(shift, s, en)
  }

  const style: CSSProperties & Record<"--tl-accent", string> = {
    "--tl-accent": accent,
    gridRow: row + 1,
    gridColumn: `${start + 1} / ${end + 2}`,
    marginTop: 27,
    marginLeft: 7,
    marginRight: shift.continues ? 0 : 10,
    // runs into next week: hug the copy and let the grid edge clip it (as in Figma)
    ...(shift.continues && end === 6 ? { justifySelf: "start", width: "max-content", minWidth: "calc(100% - 7px)" } : {}),
  }
  const totalHours = shiftHours(shift)

  function edit() {
    setOpen(false)
    if (barRef.current) onEdit(shift, barRef.current)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip disabled={!!dragMode}>
        <TooltipTrigger
          render={
            <PopoverTrigger
              ref={setBarRef}
              onDoubleClick={edit}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => endDrag(true)}
              onPointerCancel={() => endDrag(false)}
              onLostPointerCapture={() => drag.current?.active && endDrag(true)}
              onContextMenu={(e) => drag.current && e.preventDefault()}
              onKeyDown={onKeyDown}
              onClick={(e) => {
                // the click that ends a drag must not open the details popover
                if (suppressClick.current) e.preventBaseUIHandler()
              }}
              className="tl-bar relative z-[3] flex h-[30px] items-center justify-center self-start overflow-hidden rounded-[7px] px-1.5 py-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--ring-focus)"
              style={style}
              data-flagged={flagged && warning ? warning.kind : undefined}
              data-dragging={dragMode ?? undefined}
              aria-label={`${employee.name}: ${shift.title}, ${shiftDayRange(shift, true)}, ${shift.startTime} to ${shift.endTime}`}
              aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Delete"
            />
          }
        >
          <span aria-hidden data-handle="start" className="tl-bar-handle left-0" />
          <span className="min-w-0 truncate text-sm font-medium whitespace-nowrap">{shift.label}</span>
          <span aria-hidden data-handle="end" className="tl-bar-handle right-0" />
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} className="flex-col items-start gap-0.5 px-2.5 py-2">
          <span className="font-medium">{shift.title}</span>
          <span className="opacity-70">
            {shiftDayRange(shift)} · {shift.startTime} – {shift.endTime}
            {shift.continues ? " · continues next week" : ""}
          </span>
        </TooltipContent>
      </Tooltip>

      <PopoverContent align="start" sideOffset={6} className="w-72 gap-3 p-3" title={shift.title}>
        <div className="flex items-start gap-2.5">
          <span aria-hidden className="mt-0.5 h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-sm font-medium text-(--tl-fg-strong)">{shift.title}</p>
            <p className="text-[13px] tracking-[-0.01em] text-(--tl-fg-legend)">
              {employee.name} · {employee.role}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-[72px_1fr] gap-x-2 gap-y-1.5 text-[13px] tracking-[-0.01em]">
          <dt className="text-(--tl-fg-legend)">Days</dt>
          <dd className="text-(--tl-fg-strong)">
            {shiftDayRange(shift, true)}
            {shift.continues ? " (continues)" : ""}
          </dd>
          <dt className="text-(--tl-fg-legend)">Time</dt>
          <dd className="text-(--tl-fg-strong) tabular-nums">
            {shift.startTime} – {shift.endTime}
          </dd>
          <dt className="text-(--tl-fg-legend)">Total</dt>
          <dd className="text-(--tl-fg-strong) tabular-nums">
            {formatHours(totalHours)} hrs · {formatHours(shift.hoursPerDay)} hrs/day
          </dd>
        </dl>
        {warning && (
          <div className="flex items-start justify-between gap-2 rounded-md bg-(--tl-danger-bg) p-2 shadow-[0px_0px_0px_1px_var(--tl-danger-ring)]">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-(--tl-danger)">
                {warning.kind === "conflict" ? "Conflict" : "Overtime"}
              </span>
              <span className="text-xs leading-[1.35] tracking-[-0.01em] text-(--tl-fg-body)">{warning.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onResolve(shift.id)}
              className="tl-press shrink-0 rounded-[5px] bg-white px-2 py-1 text-xs font-medium max-md:px-3 max-md:py-2.5 text-(--tl-fg-button) shadow-(--tl-shadow-chip)"
            >
              Resolve
            </button>
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={edit}
            className="tl-press h-7 max-md:h-10 max-md:px-3.5 rounded-md bg-white px-2.5 text-[13px] font-medium tracking-[-0.01em] text-(--tl-fg-button) shadow-(--tl-shadow-chip)"
          >
            Edit shift
          </button>
          <button
            type="button"
            onClick={() => onRemove(shift)}
            className="tl-press tl-press-danger h-7 max-md:h-10 max-md:px-3.5 rounded-md bg-(--tl-danger-bg) px-2.5 text-[13px] font-medium tracking-[-0.01em] text-(--tl-danger) shadow-[0px_0px_0px_1px_var(--tl-danger-ring)]"
          >
            Remove
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
