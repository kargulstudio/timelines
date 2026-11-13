"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DAYS,
  DAY_NAMES,
  SHIFTS,
  type Connector,
  type DayIndex,
  type Department,
  type Employee,
  type Shift,
  type ShiftWarning,
  type WarningKind,
} from "@/lib/data"
import { formatHours, placementProblem, type DayStatus } from "@/lib/schedule"
import { FigmaIcon, VDivider } from "./figma-icon"
import { ShiftBar, shiftDayRange } from "./shift-bar"
import { SECONDARY_BTN, ShiftEditor, type EditorTarget } from "./shift-editor"

/** Row pitch (Figma: rules every 85px). The last row is clipped to 76px like the Figma frame. */
const ROW = 85
const LAST_ROW = 76
/** vertical centre of a bar inside the day grid (1px top rule + 27px offset + 15px) */
const BAR_MID = 43

export function rowsTemplate(n: number) {
  if (n <= 0) return `${ROW}px`
  if (n === 1) return `${ROW}px`
  return `repeat(${n - 1}, ${ROW}px) ${LAST_ROW}px`
}

/** Where each seed shift sits in Figma — connectors keep their exact vectors only while nothing moved. */
const SEED_POS = new Map(SHIFTS.map((s) => [s.id, `${s.employeeId}:${s.start}:${s.end}`]))
const atSeed = (s: Shift) => SEED_POS.get(s.id) === `${s.employeeId}:${s.start}:${s.end}`

type ScheduleGridProps = {
  department: Department
  employees: Employee[]
  /** default order — Figma connector vectors only render while their rows keep the Figma geometry */
  defaultOrder: string[]
  shifts: Shift[]
  connectors: Connector[]
  showSick: boolean
  warnings: Map<string, ShiftWarning>
  highlight: WarningKind | null
  newIds: Set<string>
  emptyMessage: string
  /** live weekly hours per employee */
  hours: Map<string, number>
  /** 240px "Employee" header cell (title + add / sort controls) */
  employeeHeader: ReactNode
  onRemoveShift: (shift: Shift) => void
  onResolve: (shiftId: string) => void
  /** create (prev undefined) or update a shift; `message` overrides the toast copy */
  onSaveShift: (next: Shift, prev?: Shift, message?: string) => void
  /** mark a day off / sick, or clear it back to empty (null) */
  onSetDayStatus: (employeeId: string, day: DayIndex, status: DayStatus | null) => void
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
  hours,
  employeeHeader,
  onRemoveShift,
  onResolve,
  onSaveShift,
  onSetDayStatus,
}: ScheduleGridProps) {
  const rowOf = new Map(employees.map((e, i) => [e.id, i]))
  const byId = new Map(employees.map((e) => [e.id, e]))
  const shiftById = new Map(shifts.map((s) => [s.id, s]))
  const visibleShifts = shifts.filter((s) => rowOf.has(s.employeeId))
  const template = rowsTemplate(employees.length)

  const gridRef = useRef<HTMLDivElement>(null)
  const gridWidth = useElementWidth(gridRef)

  /* ------------------------------ editor ------------------------------ */
  const [editor, setEditor] = useState<{ target: EditorTarget; anchor: HTMLElement } | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const editorEmployee = editor
    ? byId.get(editor.target.kind === "edit" ? editor.target.shift.employeeId : editor.target.employeeId)
    : undefined

  function openEditor(target: EditorTarget, anchor: HTMLElement) {
    setEditor({ target, anchor })
    setEditorOpen(true)
  }

  /* ------------------------------ cells ------------------------------- */
  const covered = new Set<string>()
  for (const s of visibleShifts) for (let d = s.start; d <= s.end; d++) covered.add(`${s.employeeId}:${d}`)

  /* ---------------------------- connectors ---------------------------- */
  const figmaConnectors: { c: Connector; anchor: Shift; row: number }[] = []
  const liveConnectors: ({ c: Connector } & ReturnType<typeof linkPath>)[] = []
  for (const c of connectors) {
    const from = shiftById.get(c.fromShiftId)
    const to = shiftById.get(c.toShiftId)
    const anchor = shiftById.get(c.anchorShiftId)
    // an endpoint was deleted → the link goes with it
    if (!from || !to) continue
    const rf = rowOf.get(from.employeeId)
    const rt = rowOf.get(to.employeeId)
    if (rf === undefined || rt === undefined) continue
    const expected = defaultOrder.indexOf(to.employeeId) - defaultOrder.indexOf(from.employeeId)
    const untouched = anchor && atSeed(from) && atSeed(to) && atSeed(anchor) && rt - rf === expected
    if (untouched) {
      figmaConnectors.push({ c, anchor, row: rowOf.get(anchor.employeeId)! })
      continue
    }
    // re-placed from the live data
    if (!gridWidth) continue
    liveConnectors.push({ c, ...linkPath(from, to, rf, rt, gridWidth) })
  }

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
            employees.map((e) => (
              <EmployeeCell key={e.id} employee={e} hours={hours.get(e.id) ?? 0} isNew={newIds.has(e.id)} />
            ))
          )}
        </div>

        {/* Day grid — 1:10144 */}
        <div
          ref={gridRef}
          data-highlight={highlight ?? undefined}
          className="relative grid min-w-0 flex-1 grid-cols-7 overflow-hidden pt-px"
          style={{ gridTemplateRows: template }}
        >
          {/* z0: row rules + dashed centre track */}
          {employees.map((e, i) => (
            <div key={`track-${e.id}`} aria-hidden className="tl-row-track col-span-7" style={{ gridRow: i + 1, gridColumn: "1 / -1" }} />
          ))}

          {/* z1: unavailable cells — click for a small menu to switch or clear them */}
          {employees.flatMap((e, i) => [
            ...e.off.map((d) => (
              <DayStatusMenu
                key={`off-${e.id}-${d}`}
                employee={e}
                day={d}
                status="off"
                showSick={showSick}
                onSetDayStatus={onSetDayStatus}
                trigger={
                  <DropdownMenuTrigger
                    className="tl-hatch-off tl-day relative z-[1] mt-px flex items-center justify-center outline-none"
                    style={{ gridRow: i + 1, gridColumn: d + 1 }}
                    aria-label={`${e.name} is off on ${DAY_NAMES[d]}. Change`}
                  />
                }
              >
                <span className="flex items-center justify-center rounded-[5px] bg-white px-1.5 py-1 shadow-(--tl-shadow-chip)">
                  <span className="px-0.5 text-sm font-medium text-(--tl-fg-button)">OFF</span>
                </span>
              </DayStatusMenu>
            )),
            ...(showSick
              ? e.sick.map((d) => (
                  <DayStatusMenu
                    key={`sick-${e.id}-${d}`}
                    employee={e}
                    day={d}
                    status="sick"
                    showSick={showSick}
                    onSetDayStatus={onSetDayStatus}
                    tooltip={`${e.name.split(" ")[0]} · sick on ${DAYS[d]}`}
                    trigger={
                      <DropdownMenuTrigger
                        className="tl-hatch-sick tl-day relative z-[1] mt-px outline-none"
                        style={{ gridRow: i + 1, gridColumn: d + 1 }}
                        aria-label={`${e.name} is out sick on ${DAY_NAMES[d]}. Change`}
                      />
                    }
                  />
                ))
              : []),
          ])}

          {/* z1: empty cells — click to add a shift */}
          {employees.flatMap((e, i) =>
            DAYS.map((_, d) => {
              const day = d as DayIndex
              if (covered.has(`${e.id}:${d}`) || e.off.includes(day) || (showSick && e.sick.includes(day))) return null
              return (
                <EmptyCell
                  key={`empty-${e.id}-${d}`}
                  employee={e}
                  day={day}
                  row={i}
                  showSick={showSick}
                  onAdd={(anchor) => openEditor({ kind: "add", employeeId: e.id, day }, anchor)}
                  onSetDayStatus={onSetDayStatus}
                />
              )
            })
          )}

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
                onEdit={(shift, anchor) => openEditor({ kind: "edit", shift }, anchor)}
                canPlace={(shift, start, end) =>
                  !placementProblem(byId.get(shift.employeeId)!, shifts, start, end, {
                    ignoreShiftId: shift.id,
                    showSick,
                  })
                }
                onMove={(shift, start, end) => {
                  const next: Shift = {
                    ...shift,
                    start: start as DayIndex,
                    end: end as DayIndex,
                    continues: shift.continues && end === 6 ? true : undefined,
                  }
                  const verb = start !== shift.start && end !== shift.end && end - start === shift.end - shift.start ? "Moved" : "Resized"
                  onSaveShift(next, shift, `${verb} “${shift.title}” to ${shiftDayRange(next)}`)
                }}
              />
            )
          })}

          {/* z4: switch / cover links — exact Figma vectors, rotated 180° as in the file */}
          {figmaConnectors.map(({ c, anchor, row }) => {
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

          {/* z4: links whose shifts moved — redrawn from the current positions in the same stroke */}
          {liveConnectors.length > 0 && (
            <svg
              aria-hidden
              className="tl-connector pointer-events-none absolute inset-0 z-[4] size-full overflow-visible"
              fill="none"
            >
              {liveConnectors.map(({ c, d, a, b, dir }) => (
                <g key={c.id} fill={department.accent}>
                  <path d={d} stroke={department.accent} strokeWidth={1.4} fill="none" />
                  {c.kind === "switch" ? (
                    <circle cx={a.x} cy={a.y} r={3.2} />
                  ) : (
                    <path d={`M ${b.x} ${b.y} L ${b.x - 7 * dir} ${b.y - 4} L ${b.x - 7 * dir} ${b.y + 4} Z`} />
                  )}
                </g>
              ))}
            </svg>
          )}
        </div>
      </div>

      {/* One editor per card, anchored to the bar or cell that opened it */}
      <Popover open={editorOpen} onOpenChange={setEditorOpen}>
        <PopoverContent
          anchor={editor?.anchor}
          align="start"
          sideOffset={6}
          className="w-80 gap-3 p-3"
          finalFocus={editor?.anchor.isConnected ? { current: editor.anchor } : false}
        >
          {editor && editorEmployee && (
            <ShiftEditor
              // remount per target so the form starts from fresh values
              key={editor.target.kind === "edit" ? editor.target.shift.id : `${editor.target.employeeId}:${editor.target.day}`}
              target={editor.target}
              employee={editorEmployee}
              shifts={shifts}
              accent={department.accent}
              showSick={showSick}
              onCancel={() => setEditorOpen(false)}
              onSave={(next) => {
                setEditorOpen(false)
                onSaveShift(next, editor.target.kind === "edit" ? editor.target.shift : undefined)
              }}
              onDelete={(shift) => {
                setEditorOpen(false)
                onRemoveShift(shift)
              }}
              extraActions={
                editor.target.kind === "add" && (
                  <>
                    <button
                      type="button"
                      className={SECONDARY_BTN}
                      onClick={() => {
                        if (editor.target.kind !== "add") return
                        setEditorOpen(false)
                        onSetDayStatus(editor.target.employeeId, editor.target.day, "off")
                      }}
                    >
                      Day off
                    </button>
                    {showSick && (
                      <button
                        type="button"
                        className={SECONDARY_BTN}
                        onClick={() => {
                          if (editor.target.kind !== "add") return
                          setEditorOpen(false)
                          onSetDayStatus(editor.target.employeeId, editor.target.day, "sick")
                        }}
                      >
                        Sick
                      </button>
                    )}
                  </>
                )
              }
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * Empty day in an employee row: the whole cell adds a shift (a ghost bar shows
 * on hover / focus); a small corner menu marks the day off or sick.
 */
function EmptyCell({
  employee,
  day,
  row,
  showSick,
  onAdd,
  onSetDayStatus,
}: {
  employee: Employee
  day: DayIndex
  row: number
  showSick: boolean
  onAdd: (anchor: HTMLElement) => void
  onSetDayStatus: (employeeId: string, day: DayIndex, status: DayStatus | null) => void
}) {
  const cellRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={cellRef} className="group/cell relative z-[1] mt-px" style={{ gridRow: row + 1, gridColumn: day + 1 }}>
      <button
        type="button"
        onClick={(e) => onAdd(e.currentTarget)}
        aria-label={`Add a shift for ${employee.name} on ${DAY_NAMES[day]}`}
        className="peer absolute inset-0 cursor-pointer outline-none"
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-[26px] right-2.5 left-[7px] flex h-[30px] items-center justify-center gap-1 rounded-[7px] bg-white/70",
          "shadow-[0px_0px_0px_1px_var(--tl-ring)] [border:1px_dashed_#d9d9d9]",
          "opacity-0 transition-opacity duration-(--duration-fast) ease-out-strong",
          "group-hover/cell:opacity-100 peer-focus-visible:opacity-100 peer-focus-visible:shadow-[0px_0px_0px_2px_var(--ring-focus)]"
        )}
      >
        <FigmaIcon src="/figma/icons/plus.svg" size={12} />
      </span>
      {/* keyboard users get the same actions from the editor's "Day off" / "Sick" buttons */}
      <DropdownMenu>
        <DropdownMenuTrigger
          tabIndex={-1}
          aria-label={`Day options for ${employee.name} on ${DAY_NAMES[day]}`}
          className={cn(
            "absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center rounded-[5px] opacity-0 outline-none",
            "transition-[opacity,background-color] duration-(--duration-fast) hover:bg-[rgba(13,14,19,0.05)] data-popup-open:bg-[rgba(13,14,19,0.08)]",
            "group-hover/cell:opacity-100 data-popup-open:opacity-100 pointer-coarse:hidden"
          )}
        >
          <FigmaIcon src="/figma/icons/dots-horizontal.svg" size={12} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44" sideOffset={6}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>{DAY_NAMES[day]}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => cellRef.current && onAdd(cellRef.current)}>Add shift…</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetDayStatus(employee.id, day, "off")}>Mark as day off</DropdownMenuItem>
            {showSick && (
              <DropdownMenuItem onClick={() => onSetDayStatus(employee.id, day, "sick")}>Mark as sick</DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** OFF / Sick cell: the hatched cell itself opens a menu to switch or clear the day. */
function DayStatusMenu({
  employee,
  day,
  status,
  showSick,
  onSetDayStatus,
  trigger,
  tooltip,
  children,
}: {
  employee: Employee
  day: DayIndex
  status: DayStatus
  showSick: boolean
  onSetDayStatus: (employeeId: string, day: DayIndex, status: DayStatus | null) => void
  trigger: React.ReactElement
  tooltip?: string
  children?: ReactNode
}) {
  return (
    <DropdownMenu>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger render={trigger}>{children}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger render={trigger}>{children}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent align="center" className="w-44" side="bottom" sideOffset={-24}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {employee.name.split(" ")[0]} · {DAY_NAMES[day]}
          </DropdownMenuLabel>
          {status === "off" && showSick && (
            <DropdownMenuItem onClick={() => onSetDayStatus(employee.id, day, "sick")}>Mark as sick</DropdownMenuItem>
          )}
          {status === "sick" && (
            <DropdownMenuItem onClick={() => onSetDayStatus(employee.id, day, "off")}>Mark as day off</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onSetDayStatus(employee.id, day, null)}>
            {status === "off" ? "Clear day off" : "Clear sick day"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EmployeeCell({ employee, hours, isNew }: { employee: Employee; hours: number; isNew: boolean }) {
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
              {formatHours(hours)} hrs
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

/**
 * A link between two bars drawn from their current positions: an S-curve
 * between facing edges when the bars sit side by side, or a bracket on the
 * free side when their days overlap. `dir` is the arrow direction at `b`.
 */
function linkPath(from: Shift, to: Shift, rowFrom: number, rowTo: number, width: number) {
  const col = width / 7
  const left = (s: Shift) => s.start * col + 7
  const right = (s: Shift) => Math.min((s.end + 1) * col - 10, width - 2)
  const ya = BAR_MID + rowFrom * ROW
  const yb = BAR_MID + rowTo * ROW
  if (from.end < to.start || to.end < from.start) {
    const toRight = from.end < to.start
    const a = { x: toRight ? right(from) : left(from), y: ya }
    const b = { x: toRight ? left(to) : right(to), y: yb }
    const mid = (a.x + b.x) / 2
    return { a, b, dir: toRight ? 1 : -1, d: `M ${a.x} ${a.y} C ${mid} ${a.y}, ${mid} ${b.y}, ${b.x} ${b.y}` }
  }
  const k = Math.max(22, Math.abs(yb - ya) * 0.32)
  const onLeft = Math.min(from.start, to.start) > 0
  if (onLeft) {
    const a = { x: left(from), y: ya }
    const b = { x: left(to), y: yb }
    const x = Math.min(a.x, b.x) - k
    return { a, b, dir: 1, d: `M ${a.x} ${a.y} C ${x} ${a.y}, ${x} ${b.y}, ${b.x} ${b.y}` }
  }
  const a = { x: right(from), y: ya }
  const b = { x: right(to), y: yb }
  const x = Math.max(a.x, b.x) + k
  return { a, b, dir: -1, d: `M ${a.x} ${a.y} C ${x} ${a.y}, ${x} ${b.y}, ${b.x} ${b.y}` }
}

/** Width of an element, kept current with a ResizeObserver (0 until mounted). */
function useElementWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}
