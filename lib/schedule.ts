/**
 * Pure schedule helpers: time parsing, placement rules, weekly hours and
 * warnings. Everything works on the weekly template in lib/data.ts.
 */
import {
  DAY_NAMES,
  EMPLOYEES,
  SHIFTS,
  WARNINGS,
  type DayIndex,
  type Employee,
  type Shift,
  type ShiftWarning,
} from "./data"

export const DEFAULT_WEEKLY_LIMIT = 40

/* -------------------------------------------------------------------------- */
/* Time                                                                        */
/* -------------------------------------------------------------------------- */

/** "8:00 AM" → minutes after midnight */
export function parseTime(label: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(label.trim())
  if (!m) return 0
  let h = Number(m[1]) % 12
  if (m[3].toUpperCase() === "PM") h += 12
  return h * 60 + Number(m[2])
}

/** minutes after midnight → "8:00 AM" */
export function formatTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  const h24 = Math.floor(m / 60)
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`
}

/** "8:00 AM" ↔ "08:00" for <input type="time"> */
export function toInputTime(label: string): string {
  const m = parseTime(label)
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}
export function fromInputTime(value: string): string {
  const [h, m] = value.split(":").map(Number)
  return formatTime((h || 0) * 60 + (m || 0))
}

/** Paid hours per day; an end time before the start runs past midnight. */
export function hoursBetween(startTime: string, endTime: string): number {
  let diff = parseTime(endTime) - parseTime(startTime)
  if (diff <= 0) diff += 24 * 60
  return Math.round((diff / 60) * 4) / 4
}

export function shiftLabel(title: string, startTime: string, endTime: string) {
  return `${title} (${startTime} – ${endTime})`
}

export function formatHours(h: number) {
  return String(Math.round(h * 100) / 100)
}

/* -------------------------------------------------------------------------- */
/* Placement                                                                   */
/* -------------------------------------------------------------------------- */

export function daysOf(shift: Pick<Shift, "start" | "end">): DayIndex[] {
  const out: DayIndex[] = []
  for (let d = shift.start; d <= shift.end; d++) out.push(d as DayIndex)
  return out
}

export function shiftHours(shift: Shift) {
  return shift.hoursPerDay * (shift.end - shift.start + 1)
}

export type DayStatus = "off" | "sick"

/** Days that can't take a shift: other shifts, days off and (when shown) sick days. */
export function placementProblem(
  employee: Employee,
  shifts: Shift[],
  start: number,
  end: number,
  opts: { ignoreShiftId?: string; showSick: boolean; allowUnavailable?: boolean }
): string | null {
  if (start < 0 || end > 6 || start > end) return "Pick a valid day range"
  const first = employee.name.split(" ")[0]
  for (const s of shifts) {
    if (s.employeeId !== employee.id || s.id === opts.ignoreShiftId) continue
    if (s.start <= end && s.end >= start) return `Overlaps “${s.title}” (${DAY_NAMES[Math.max(s.start, start)]})`
  }
  if (opts.allowUnavailable) return null
  for (let d = start; d <= end; d++) {
    if (employee.off.includes(d as DayIndex)) return `${first} is off on ${DAY_NAMES[d]}`
    if (opts.showSick && employee.sick.includes(d as DayIndex)) return `${first} is out sick on ${DAY_NAMES[d]}`
  }
  return null
}

/* -------------------------------------------------------------------------- */
/* Weekly hours                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Figma's hour pills don't equal the sum of the bars drawn next to them, so the
 * difference is kept as a fixed per-employee offset: the untouched schedule
 * reads exactly as in Figma, and every edit moves the total by its own hours.
 */
const HOURS_OFFSET = new Map(
  EMPLOYEES.map((e) => [
    e.id,
    e.hours - SHIFTS.filter((s) => s.employeeId === e.id).reduce((n, s) => n + shiftHours(s), 0),
  ])
)

export function weeklyHours(employees: Employee[], shifts: Shift[]): Map<string, number> {
  const out = new Map(employees.map((e) => [e.id, HOURS_OFFSET.get(e.id) ?? 0]))
  for (const s of shifts) if (out.has(s.employeeId)) out.set(s.employeeId, out.get(s.employeeId)! + shiftHours(s))
  for (const [id, h] of out) out.set(id, Math.max(0, h))
  return out
}

/* -------------------------------------------------------------------------- */
/* Warnings                                                                    */
/* -------------------------------------------------------------------------- */

const SEED_WARNINGS = new Map(WARNINGS.map((w) => [w.shiftId, w]))

/**
 * Untouched seed shifts keep their Figma conflict copy. Shifts that were
 * created, moved, resized or retimed are re-checked against days off and sick
 * days. Overtime is always computed from the live weekly totals.
 */
export function computeWarnings(
  employees: Employee[],
  shifts: Shift[],
  touched: Set<string>,
  hours: Map<string, number>,
  showSick: boolean
): ShiftWarning[] {
  const out: ShiftWarning[] = []
  const byId = new Map(employees.map((e) => [e.id, e]))

  for (const s of shifts) {
    const e = byId.get(s.employeeId)
    if (!e) continue
    const seed = SEED_WARNINGS.get(s.id)
    if (!touched.has(s.id)) {
      if (seed?.kind === "conflict") out.push(seed)
      continue
    }
    const first = e.name.split(" ")[0]
    const offDay = daysOf(s).find((d) => e.off.includes(d))
    const sickDay = showSick ? daysOf(s).find((d) => e.sick.includes(d)) : undefined
    if (offDay !== undefined) {
      out.push({ shiftId: s.id, kind: "conflict", message: `Runs into ${first}'s day off on ${DAY_NAMES[offDay]}` })
    } else if (sickDay !== undefined) {
      out.push({ shiftId: s.id, kind: "conflict", message: `Overlaps ${first}'s sick day on ${DAY_NAMES[sickDay]}` })
    }
  }

  const flagged = new Set(out.map((w) => w.shiftId))
  for (const e of employees) {
    const limit = e.limit ?? DEFAULT_WEEKLY_LIMIT
    const total = hours.get(e.id) ?? 0
    if (total <= limit) continue
    const own = shifts.filter((s) => s.employeeId === e.id && !flagged.has(s.id))
    if (own.length === 0) continue
    // prefer the shift Figma flags, else the longest one
    const target =
      own.find((s) => SEED_WARNINGS.get(s.id)?.kind === "overtime") ??
      own.reduce((a, b) => (shiftHours(b) > shiftHours(a) ? b : a))
    const over = total - limit
    const seed = SEED_WARNINGS.get(target.id)
    const seedOver = seed?.kind === "overtime" ? e.hours - limit : null
    out.push({
      shiftId: target.id,
      kind: "overtime",
      message:
        seed && seedOver === over
          ? seed.message
          : `Pushes ${e.name.split(" ")[0]} ${formatHours(over)} hrs past the ${limit} hr weekly limit`,
    })
  }
  return out
}
