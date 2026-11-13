"use client"

import { useId, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { DAY_NAMES, type DayIndex, type Employee, type Shift } from "@/lib/data"
import {
  formatHours,
  fromInputTime,
  hoursBetween,
  placementProblem,
  shiftLabel,
  toInputTime,
} from "@/lib/schedule"

export type EditorTarget =
  | { kind: "edit"; shift: Shift }
  | { kind: "add"; employeeId: string; day: DayIndex }

/** Shared field recipe (same as the Add employee form). */
export const FIELD =
  "h-8 w-full min-w-0 rounded-md bg-white px-2 text-[13px] tracking-[-0.01em] text-(--tl-fg-strong) shadow-(--tl-shadow-chip) outline-none placeholder:text-(--tl-fg-placeholder) focus:shadow-[0px_0px_0px_1px_#d4d4d4,0px_0px_0px_3px_rgba(16,103,255,0.14)] max-md:h-10 max-md:text-base"

export const SECONDARY_BTN =
  "tl-press h-7 rounded-md bg-white px-2.5 text-[13px] font-medium tracking-[-0.01em] text-(--tl-fg-button) shadow-(--tl-shadow-chip) max-md:h-10 max-md:px-3.5"

export const DANGER_BTN =
  "tl-press tl-press-danger h-7 rounded-md bg-(--tl-danger-bg) px-2.5 text-[13px] font-medium tracking-[-0.01em] text-(--tl-danger) shadow-[0px_0px_0px_1px_var(--tl-danger-ring)] max-md:h-10 max-md:px-3.5"

export const PRIMARY_BTN =
  "tl-press tl-press-dark h-7 rounded-md bg-(--tl-publish) px-3 text-[13px] font-medium tracking-[-0.01em] text-white disabled:cursor-default disabled:opacity-40 max-md:h-10 max-md:px-4"

type ShiftEditorProps = {
  target: EditorTarget
  employee: Employee
  /** shifts in the employee's department (used to block overlaps) */
  shifts: Shift[]
  accent: string
  showSick: boolean
  onSave: (shift: Shift) => void
  onCancel: () => void
  onDelete?: (shift: Shift) => void
  /** extra footer actions on the left (e.g. "Day off" / "Sick" when adding) */
  extraActions?: ReactNode
}

/**
 * Edit or create a shift: title, start/end time and the day range.
 * Enter saves (native form submit); Esc closes the surrounding popover.
 */
export function ShiftEditor({
  target,
  employee,
  shifts,
  accent,
  showSick,
  onSave,
  onCancel,
  onDelete,
  extraActions,
}: ShiftEditorProps) {
  const id = useId()
  const initial = target.kind === "edit" ? target.shift : null
  const [title, setTitle] = useState(initial?.title ?? "")
  const [startTime, setStartTime] = useState(toInputTime(initial?.startTime ?? "9:00 AM"))
  const [endTime, setEndTime] = useState(toInputTime(initial?.endTime ?? "5:00 PM"))
  const [start, setStart] = useState<number>(initial?.start ?? (target.kind === "add" ? target.day : 0))
  const [end, setEnd] = useState<number>(initial?.end ?? (target.kind === "add" ? target.day : 0))

  const startLabel = fromInputTime(startTime)
  const endLabel = fromInputTime(endTime)
  const perDay = startTime && endTime ? hoursBetween(startLabel, endLabel) : 0
  const days = end - start + 1
  const ignoreShiftId = initial?.id
  // hard stop: another shift on those days. Soft: a day off / sick day (saved, but flagged as a conflict).
  const blocked = placementProblem(employee, shifts, start, end, { ignoreShiftId, showSick, allowUnavailable: true })
  const unavailable = blocked ? null : placementProblem(employee, shifts, start, end, { ignoreShiftId, showSick })
  const canSave = title.trim().length > 0 && !!startTime && !!endTime && !blocked

  function submit() {
    if (!canSave) return
    const t = title.trim()
    const base: Shift = initial ?? {
      id: "",
      employeeId: employee.id,
      start: start as DayIndex,
      end: end as DayIndex,
      label: "",
      title: t,
      startTime: startLabel,
      endTime: endLabel,
      hoursPerDay: perDay,
    }
    const copyChanged = !initial || initial.title !== t || initial.startTime !== startLabel || initial.endTime !== endLabel
    onSave({
      ...base,
      title: t,
      start: start as DayIndex,
      end: end as DayIndex,
      startTime: startLabel,
      endTime: endLabel,
      // keep Figma's bar copy (and its hours) until the shift is actually retimed or renamed
      label: copyChanged ? shiftLabel(t, startLabel, endLabel) : base.label,
      hoursPerDay: initial && initial.startTime === startLabel && initial.endTime === endLabel ? initial.hoursPerDay : perDay,
      continues: base.continues && end === 6 ? true : undefined,
    })
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="flex items-start gap-2.5">
        <span aria-hidden className="mt-0.5 h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium text-(--tl-fg-strong)">{target.kind === "edit" ? "Edit shift" : "New shift"}</p>
          <p className="truncate text-[13px] tracking-[-0.01em] text-(--tl-fg-legend)">
            {employee.name} · {employee.role}
          </p>
        </div>
      </div>

      <Field label="Title" htmlFor={`${id}-title`}>
        <input
          id={`${id}-title`}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning Shift"
          autoComplete="off"
          className={FIELD}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Starts" htmlFor={`${id}-st`}>
          <input
            id={`${id}-st`}
            type="time"
            step={900}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={cn(FIELD, "tabular-nums")}
          />
        </Field>
        <Field label="Ends" htmlFor={`${id}-et`}>
          <input
            id={`${id}-et`}
            type="time"
            step={900}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={cn(FIELD, "tabular-nums")}
          />
        </Field>
        <Field label="From" htmlFor={`${id}-sd`}>
          <select
            id={`${id}-sd`}
            value={start}
            onChange={(e) => {
              const v = Number(e.target.value)
              setStart(v)
              if (v > end) setEnd(v)
            }}
            className={cn(FIELD, "cursor-pointer pr-1")}
          >
            {DAY_NAMES.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="To" htmlFor={`${id}-ed`}>
          <select
            id={`${id}-ed`}
            value={end}
            onChange={(e) => {
              const v = Number(e.target.value)
              setEnd(v)
              if (v < start) setStart(v)
            }}
            className={cn(FIELD, "cursor-pointer pr-1")}
          >
            {DAY_NAMES.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <p className="text-xs tracking-[-0.01em] text-(--tl-fg-legend) tabular-nums">
        {formatHours(perDay)} hrs/day · {formatHours(perDay * days)} hrs this week
      </p>

      {(blocked || unavailable) && (
        <p
          role={blocked ? "alert" : "status"}
          className={cn(
            "rounded-md px-2 py-1.5 text-xs leading-[1.35] tracking-[-0.01em]",
            blocked
              ? "bg-(--tl-danger-bg) text-(--tl-danger) shadow-[0px_0px_0px_1px_var(--tl-danger-ring)]"
              : "bg-[rgba(246,158,9,0.08)] text-[#b46f00] shadow-[0px_0px_0px_1px_rgba(246,158,9,0.2)]"
          )}
        >
          {blocked ?? `${unavailable} — this will be flagged as a conflict.`}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {initial && onDelete && (
            <button type="button" onClick={() => onDelete(initial)} className={DANGER_BTN}>
              Delete
            </button>
          )}
          {extraActions}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className={SECONDARY_BTN}>
            Cancel
          </button>
          <button type="submit" disabled={!canSave} className={PRIMARY_BTN}>
            {target.kind === "edit" ? "Save" : "Add shift"}
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-(--tl-fg-legend)">
        {label}
      </label>
      {children}
    </div>
  )
}
