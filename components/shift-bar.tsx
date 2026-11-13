"use client"

import type { CSSProperties } from "react"
import { comingSoon } from "@/lib/prototype"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DAYS, DAY_NAMES, type Employee, type Shift, type ShiftWarning } from "@/lib/data"

export function shiftDays(shift: Shift) {
  return shift.end - shift.start + 1
}

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
}

/**
 * Figma shift bar (e.g. 1:10363): 30px, r-7, accent tint at 6% over white,
 * 1px accent ring at 14%, Inter Medium 14 centred. Placed on the CSS grid by day.
 */
export function ShiftBar({ shift, employee, row, accent, warning, flagged, onRemove, onResolve }: ShiftBarProps) {
  const style: CSSProperties & Record<"--tl-accent", string> = {
    "--tl-accent": accent,
    gridRow: row + 1,
    gridColumn: `${shift.start + 1} / ${shift.end + 2}`,
    marginTop: 27,
    marginLeft: 7,
    marginRight: shift.continues ? 0 : 10,
    // runs into next week: hug the copy and let the grid edge clip it (as in Figma)
    ...(shift.continues ? { justifySelf: "start", width: "max-content", minWidth: "calc(100% - 7px)" } : {}),
  }
  const totalHours = shift.hoursPerDay * shiftDays(shift)

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              className="tl-bar relative z-[3] flex h-[30px] items-center justify-center self-start overflow-hidden rounded-[7px] px-1.5 py-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--ring-focus)"
              style={style}
              data-flagged={flagged && warning ? warning.kind : undefined}
              aria-label={`${employee.name}: ${shift.title}, ${shiftDayRange(shift, true)}, ${shift.startTime} to ${shift.endTime}`}
            />
          }
        >
          <span className="min-w-0 truncate text-sm font-medium whitespace-nowrap">{shift.label}</span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} className="flex-col items-start gap-0.5 px-2.5 py-2">
          <span className="font-medium">{shift.title}</span>
          <span className="opacity-70">
            {shiftDayRange(shift)} · {shift.startTime} – {shift.endTime}
            {shift.continues ? " · continues next week" : ""}
          </span>
        </TooltipContent>
      </Tooltip>

      <PopoverContent align="start" sideOffset={6} className="w-72 gap-3 p-3">
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
            {totalHours} hrs · {shift.hoursPerDay} hrs/day
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
              className="tl-press shrink-0 rounded-[5px] bg-white px-2 py-1 text-xs font-medium text-(--tl-fg-button) shadow-(--tl-shadow-chip)"
            >
              Resolve
            </button>
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => comingSoon("Shift editor")}
            className="tl-press h-7 rounded-md bg-white px-2.5 text-[13px] font-medium tracking-[-0.01em] text-(--tl-fg-button) shadow-(--tl-shadow-chip)"
          >
            Edit shift
          </button>
          <button
            type="button"
            onClick={() => onRemove(shift)}
            className="tl-press tl-press-danger h-7 rounded-md bg-(--tl-danger-bg) px-2.5 text-[13px] font-medium tracking-[-0.01em] text-(--tl-danger) shadow-[0px_0px_0px_1px_var(--tl-danger-ring)]"
          >
            Remove
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
