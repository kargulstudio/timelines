"use client"

import { useRef, useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/responsive-popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Connector, DayIndex, Department, Employee, Shift, ShiftWarning, WarningKind } from "@/lib/data"
import type { DayStatus } from "@/lib/schedule"
import { FigmaIcon, VDivider } from "./figma-icon"
import { ScheduleGrid } from "./schedule-grid"

export type SortMode = "default" | "name" | "hours"

type DepartmentCardProps = {
  department: Department
  employees: Employee[]
  defaultOrder: string[]
  shifts: Shift[]
  connectors: Connector[]
  showSick: boolean
  warnings: Map<string, ShiftWarning>
  highlight: WarningKind | null
  newIds: Set<string>
  emptyMessage: string
  sort: SortMode
  onSortChange: (s: SortMode) => void
  addOpen: boolean
  onAddOpenChange: (open: boolean) => void
  onAddEmployee: (name: string, role: string) => void
  hours: Map<string, number>
  onRemoveShift: (shift: Shift) => void
  onResolve: (shiftId: string) => void
  onSaveShift: (next: Shift, prev?: Shift, message?: string) => void
  onSetDayStatus: (employeeId: string, day: DayIndex, status: DayStatus | null) => void
  onRename: (name: string) => void
  onRemoveEmployee: (employee: Employee) => void
}

/** Figma 1:10044 / 1:10416 — department card: header, schedule table, legend. */
export function DepartmentCard(props: DepartmentCardProps) {
  const { department, sort, onSortChange, addOpen, onAddOpenChange, onAddEmployee } = props
  const [collapsed, setCollapsed] = useState(false)
  const [showLinks, setShowLinks] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const bodyId = `tl-card-${department.id}`

  return (
    <section
      aria-labelledby={`${bodyId}-title`}
      className="flex flex-col overflow-hidden rounded-[14px] bg-white p-4 shadow-(--tl-shadow-card) max-md:p-3"
    >
      {/* Header — 1:10045 */}
      <div className="flex h-4 items-start justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="relative size-4 shrink-0 overflow-hidden rounded-[5px]"
            style={{ backgroundColor: department.accent, boxShadow: `0px 0px 0px 1px ${department.accent}` }}
          >
            <FigmaIcon src={department.icon} size={10} className="absolute top-[3px] left-[3px]" />
          </span>
          {renaming ? (
            <RenameField
              name={department.name}
              onDone={(name) => {
                setRenaming(false)
                if (name) props.onRename(name)
              }}
            />
          ) : (
            <h2
              id={`${bodyId}-title`}
              onDoubleClick={() => setRenaming(true)}
              className="tl-plain min-w-0 flex-1 truncate text-sm font-medium text-(--tl-fg-strong)"
            >
              {department.name}
            </h2>
          )}
        </div>
        <div className="flex items-center gap-2 pointer-coarse:gap-6">
          <Tooltip>
            <TooltipTrigger
              className="tl-icon-btn size-3.5"
              aria-label={`Rename ${department.name}`}
              aria-pressed={renaming}
              // keep focus in the field while it's open, so the click doesn't blur-save and reopen
              onPointerDown={(e) => renaming && e.preventDefault()}
              onClick={() => setRenaming(true)}
            >
              <FigmaIcon src="/figma/icons/edit-03.svg" />
            </TooltipTrigger>
            <TooltipContent>Rename department</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              className="tl-icon-btn size-3.5"
              aria-label="Show shift links"
              aria-pressed={showLinks}
              onClick={() => setShowLinks((v) => !v)}
            >
              <FigmaIcon src="/figma/icons/grid-01.svg" />
            </TooltipTrigger>
            <TooltipContent>{showLinks ? "Hide shift links" : "Show shift links"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              className="tl-icon-btn size-3.5"
              aria-label={collapsed ? `Expand ${department.name}` : `Collapse ${department.name}`}
              aria-expanded={!collapsed}
              aria-controls={bodyId}
              onClick={() => setCollapsed((c) => !c)}
            >
              <FigmaIcon src="/figma/icons/expand-02.svg" />
            </TooltipTrigger>
            <TooltipContent>{collapsed ? "Expand" : "Collapse"}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Body — collapses with a grid-rows transition */}
      <div id={bodyId} className="tl-collapse" data-collapsed={collapsed || undefined} inert={collapsed}>
        <div>
          <div className="flex flex-col gap-4 pt-4">
            <ScheduleGrid
              department={department}
              employees={props.employees}
              defaultOrder={props.defaultOrder}
              shifts={props.shifts}
              connectors={showLinks ? props.connectors : []}
              showSick={props.showSick}
              warnings={props.warnings}
              highlight={props.highlight}
              newIds={props.newIds}
              emptyMessage={props.emptyMessage}
              hours={props.hours}
              onRemoveShift={props.onRemoveShift}
              onResolve={props.onResolve}
              onSaveShift={props.onSaveShift}
              onSetDayStatus={props.onSetDayStatus}
              onRemoveEmployee={props.onRemoveEmployee}
              employeeHeader={
                <div className="flex w-60 shrink-0 items-center gap-2 p-3 max-xl:sticky max-xl:left-0 max-xl:z-[6] max-xl:bg-(--tl-shell) max-md:w-36 max-md:gap-3 max-md:px-2 max-md:shadow-[inset_-1px_0_0_var(--tl-line)]">
                  <span className="tl-plain flex-1 text-sm font-medium text-(--tl-fg-strong)">Employee</span>
                  <AddEmployeePopover
                    department={department}
                    open={addOpen}
                    onOpenChange={onAddOpenChange}
                    onAdd={onAddEmployee}
                  />
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger
                        render={<DropdownMenuTrigger className="tl-icon-btn size-3.5 outline-none" aria-label="Sort employees" />}
                      >
                        <FigmaIcon src="/figma/icons/filter-lines.svg" className="-scale-x-100" />
                      </TooltipTrigger>
                      <TooltipContent>Sort</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-44" sideOffset={8}>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={sort} onValueChange={(v) => onSortChange(v as SortMode)}>
                          <DropdownMenuRadioItem value="default">Default</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="name">Name (A–Z)</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="hours">Hours (high–low)</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              }
            />

            {/* Legend — 1:10393 */}
            <div className="flex h-4 items-center gap-5 max-md:h-auto max-md:items-start">
              <div className="flex min-w-0 flex-1 items-center gap-3 max-md:flex-wrap max-md:gap-y-2">
                <LegendItem icon={department.legendSwitchIcon} label="Switch a Shift" />
                <LegendItem icon={department.legendCoverIcon} label="Covering a Shift" />
                <VDivider />
                <LegendItem icon="/figma/icons/legend-square.svg" label="Sick" />
              </div>
              {/* hover for the short version; click / tap for how to edit the schedule */}
              <Popover>
                <Tooltip>
                  <TooltipTrigger
                    render={<PopoverTrigger className="tl-icon-btn size-3.5 outline-none" aria-label="About this legend" />}
                  >
                    <FigmaIcon src="/figma/icons/help-circle.svg" />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-60">
                    Dots mark switched shifts, arrows mark covers. Hatched cells are days off or sick days.
                  </TooltipContent>
                </Tooltip>
                <PopoverContent side="top" align="end" sideOffset={8} className="w-72 gap-2 p-3" title="About this schedule">
                  <p className="text-sm font-medium text-(--tl-fg-strong)">Reading and editing the schedule</p>
                  <ul className="flex list-disc flex-col gap-1 pl-4 text-[13px] leading-[1.4] tracking-[-0.01em] text-(--tl-fg-body)">
                    <li>Dots mark switched shifts, arrows mark covers.</li>
                    <li>Hatched cells are days off (grey) or sick days (amber). Click one to change it.</li>
                    <li>Click an empty day to add a shift, or drag a shift and its edges to move or resize it.</li>
                    <li>On touch, press and hold a shift before dragging.</li>
                  </ul>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Inline rename in the card header: Enter or blur saves, Esc cancels. */
function RenameField({ name, onDone }: { name: string; onDone: (name: string | null) => void }) {
  const [value, setValue] = useState(name)
  const done = useRef(false)
  const finish = (v: string | null) => {
    if (done.current) return
    done.current = true
    onDone(v?.trim() || null)
  }
  return (
    <input
      autoFocus
      value={value}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => finish(value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") finish(value)
        if (e.key === "Escape") {
          e.stopPropagation()
          finish(null)
        }
      }}
      aria-label="Department name"
      maxLength={60}
      className="tl-plain -my-1 -ml-1 h-6 min-w-0 flex-1 rounded-[5px] bg-white px-1 text-sm font-medium text-(--tl-fg-strong) shadow-[0px_0px_0px_1px_#d4d4d4,0px_0px_0px_3px_rgba(16,103,255,0.14)] outline-none"
    />
  )
}

function LegendItem({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex items-center gap-0.5">
      <FigmaIcon src={icon} />
      <span className="px-0.5 text-sm font-medium whitespace-nowrap text-(--tl-fg-legend)">{label}</span>
    </span>
  )
}

function AddEmployeePopover({
  department,
  open,
  onOpenChange,
  onAdd,
}: {
  department: Department
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string, role: string) => void
}) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const field =
    "h-8 max-md:h-10 max-md:text-base w-full rounded-md bg-white px-2 text-[13px] tracking-[-0.01em] text-(--tl-fg-strong) shadow-(--tl-shadow-chip) outline-none placeholder:text-(--tl-fg-placeholder) focus:shadow-[0px_0px_0px_1px_#d4d4d4,0px_0px_0px_3px_rgba(16,103,255,0.14)]"

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={<PopoverTrigger className="tl-icon-btn size-3.5 outline-none" aria-label={`Add employee to ${department.name}`} />}
        >
          <FigmaIcon src="/figma/icons/plus.svg" />
        </TooltipTrigger>
        <TooltipContent>Add employee</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" sideOffset={10} className="w-64 p-3" title={`Add to ${department.name}`}>
        <form
          className="flex flex-col gap-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            onAdd(name.trim(), role.trim() || "Team Member")
            setName("")
            setRole("")
          }}
        >
          <p className="text-sm font-medium text-(--tl-fg-strong)">Add to {department.name}</p>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            aria-label="Full name"
            className={field}
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role (e.g. Line Cook)"
            aria-label="Role"
            className={field}
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="tl-press tl-press-dark h-[30px] rounded-[7px] bg-(--tl-publish) text-sm font-medium text-white disabled:cursor-default disabled:opacity-40 max-md:h-11"
          >
            Add employee
          </button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
