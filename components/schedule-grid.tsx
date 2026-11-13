"use client"

import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DAYS, type Connector, type Department, type Employee, type Shift, type ShiftWarning, type WarningKind } from "@/lib/data"
import { FigmaIcon, VDivider } from "./figma-icon"
import { ShiftBar } from "./shift-bar"

/** Row pitch (Figma: rules every 85px). The last row is clipped to 76px like the Figma frame. */
const ROW = 85
const LAST_ROW = 76

export function rowsTemplate(n: number) {
  if (n <= 0) return `${ROW}px`
  if (n === 1) return `${ROW}px`
  return `repeat(${n - 1}, ${ROW}px) ${LAST_ROW}px`
}

type ScheduleGridProps = {
  department: Department
  employees: Employee[]
  /** default order — connectors only render while their rows keep the Figma geometry */
  defaultOrder: string[]
  shifts: Shift[]
  connectors: Connector[]
  showSick: boolean
  warnings: Map<string, ShiftWarning>
  highlight: WarningKind | null
  newIds: Set<string>
  emptyMessage: string
  /** 240px "Employee" header cell (title + add / sort controls) */
  employeeHeader: ReactNode
  onRemoveShift: (shift: Shift) => void
  onResolve: (shiftId: string) => void
}

/** Figma 1:10059 — employee column + 7-day CSS grid with bars, unavailable cells and links. */
export function ScheduleGrid({
  department,
  employees,
  defaultOrder,
  shifts,
  connectors,
  showSick,
  warnings,
  highlight,
  newIds,
  emptyMessage,
  employeeHeader,
  onRemoveShift,
  onResolve,
}: ScheduleGridProps) {
  const rowOf = new Map(employees.map((e, i) => [e.id, i]))
  const byId = new Map(employees.map((e) => [e.id, e]))
  const shiftById = new Map(shifts.map((s) => [s.id, s]))
  const visibleShifts = shifts.filter((s) => rowOf.has(s.employeeId))
  const template = rowsTemplate(employees.length)

  const visibleConnectors = connectors.flatMap((c) => {
    const from = shiftById.get(c.fromShiftId)
    const to = shiftById.get(c.toShiftId)
    const anchor = shiftById.get(c.anchorShiftId)
    if (!from || !to || !anchor) return []
    const rf = rowOf.get(from.employeeId)
    const rt = rowOf.get(to.employeeId)
    const ra = rowOf.get(anchor.employeeId)
    if (rf === undefined || rt === undefined || ra === undefined) return []
    const expected = defaultOrder.indexOf(to.employeeId) - defaultOrder.indexOf(from.employeeId)
    if (rt - rf !== expected) return []
    return [{ c, anchor, row: ra }]
  })

  return (
    // Table — r-7 with a 1px rgba(230,230,230,.6) inside stroke (drawn as an overlay so it never eats layout width)
    <div className="relative overflow-hidden rounded-[7px] after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_var(--tl-line)]">
      {/* Header row — 1:10060 */}
      <div className="flex h-[38px] gap-6 bg-(--tl-shell)">
        {employeeHeader}
        <div className="grid min-w-0 flex-1 grid-cols-7 shadow-[inset_1px_0_0_var(--tl-line)]">
          {DAYS.map((d, i) => (
            <div
              key={d}
              className={cn("flex items-center p-3", i < 6 && "shadow-[inset_-1px_0_0_var(--tl-line)]")}
            >
              <span className="tl-plain flex-1 text-sm font-medium text-(--tl-fg-day)">{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body — 1:10082 */}
      <div className="flex gap-6">
        {/* Employee column — 1:10083 */}
        <div className="grid w-60 shrink-0 px-3 pt-px" style={{ gridTemplateRows: template }}>
          {employees.length === 0 ? (
            <p className="self-center text-sm font-medium text-(--tl-fg-legend)">{emptyMessage}</p>
          ) : (
            employees.map((e) => <EmployeeCell key={e.id} employee={e} isNew={newIds.has(e.id)} />)
          )}
        </div>

        {/* Day grid — 1:10144 */}
        <div
          data-highlight={highlight ?? undefined}
          className="relative grid min-w-0 flex-1 grid-cols-7 overflow-hidden pt-px"
          style={{ gridTemplateRows: template }}
        >
          {/* z0: row rules + dashed centre track */}
          {employees.map((e, i) => (
            <div key={`track-${e.id}`} aria-hidden className="tl-row-track col-span-7" style={{ gridRow: i + 1, gridColumn: "1 / -1" }} />
          ))}

          {/* z1: unavailable cells */}
          {employees.flatMap((e, i) => [
            ...e.off.map((d) => (
              <div
                key={`off-${e.id}-${d}`}
                className="tl-hatch-off relative z-[1] mt-px flex items-center justify-center"
                style={{ gridRow: i + 1, gridColumn: d + 1 }}
              >
                <span className="flex items-center justify-center rounded-[5px] bg-white px-1.5 py-1 shadow-(--tl-shadow-chip)">
                  <span className="px-0.5 text-sm font-medium text-(--tl-fg-button)">OFF</span>
                </span>
              </div>
            )),
            ...(showSick
              ? e.sick.map((d) => (
                  <Tooltip key={`sick-${e.id}-${d}`}>
                    <TooltipTrigger
                      render={<div />}
                      className="tl-hatch-sick relative z-[1] mt-px"
                      style={{ gridRow: i + 1, gridColumn: d + 1 }}
                      aria-label={`${e.name} is out sick on ${DAYS[d]}`}
                    />
                    <TooltipContent>
                      {e.name.split(" ")[0]} · sick on {DAYS[d]}
                    </TooltipContent>
                  </Tooltip>
                ))
              : []),
          ])}

          {/* z2: column rules + left/right edges */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[2] grid grid-cols-7 shadow-[inset_1px_0_0_var(--tl-line),inset_-1px_0_0_var(--tl-line)]"
          >
            {DAYS.map((d) => (
              <div key={d} className="shadow-[inset_-1px_0_0_var(--tl-line)]" />
            ))}
          </div>

          {/* z3: shift bars */}
          {visibleShifts.map((s) => {
            const w = warnings.get(s.id)
            return (
              <ShiftBar
                key={s.id}
                shift={s}
                employee={byId.get(s.employeeId)!}
                row={rowOf.get(s.employeeId)!}
                accent={department.accent}
                warning={w}
                flagged={!!w && highlight === w.kind}
                onRemove={onRemoveShift}
                onResolve={onResolve}
              />
            )
          })}

          {/* z4: switch / cover links — exact Figma vectors, rotated 180° as in the file */}
          {visibleConnectors.map(({ c, anchor, row }) => {
            const style: CSSProperties = {
              left: `calc(${anchor.start} / 7 * 100% + ${7 + c.dx}px)`,
              top: 43 + row * ROW + c.dy,
              width: c.width,
              height: c.height,
            }
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={c.id}
                src={c.src}
                alt=""
                aria-hidden
                width={c.width}
                height={c.height}
                draggable={false}
                className="tl-connector pointer-events-none absolute z-[4] block max-w-none rotate-180"
                style={style}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EmployeeCell({ employee, isNew }: { employee: Employee; isNew: boolean }) {
  return (
    <div className={cn("mt-3 flex flex-col justify-center gap-3 self-start", isNew && "tl-enter")}>
      <div className="flex items-center gap-2">
        <Avatar employee={employee} />
        <p className="tl-plain truncate text-sm font-medium whitespace-nowrap text-(--tl-fg-strong)">{employee.name}</p>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            render={<span />}
            className="flex h-6 items-center justify-center gap-0.5 overflow-hidden rounded-[5px] bg-white px-1.5 py-[5px] shadow-(--tl-shadow-chip)"
          >
            <FigmaIcon src="/figma/icons/clock.svg" />
            <span className="px-0.5 text-sm font-medium whitespace-nowrap text-(--tl-fg-body) tabular-nums">
              {employee.hours} hrs
            </span>
          </TooltipTrigger>
          <TooltipContent>Scheduled this week</TooltipContent>
        </Tooltip>
        <VDivider />
        <span className="flex h-6 min-w-0 items-center justify-center overflow-hidden rounded-[5px] bg-white px-1.5 py-[5px] shadow-(--tl-shadow-chip)">
          <span className="truncate px-0.5 text-sm font-medium whitespace-nowrap text-(--tl-fg-body)">{employee.role}</span>
        </span>
      </div>
    </div>
  )
}

function Avatar({ employee }: { employee: Employee }) {
  if (employee.avatar) {
    return <FigmaIcon src={employee.avatar} size={24} className="rounded-full" alt="" />
  }
  const initials = employee.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d9d9d9] text-[10px] font-semibold text-[#5c5c5c]">
      {initials}
    </span>
  )
}
