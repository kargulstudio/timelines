"use client"

import { useState } from "react"
import { addDays, addWeeks, format, isSameDay, startOfWeek } from "date-fns"
import { toast } from "sonner"
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/responsive-popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BASE_WEEK_START, LOCATIONS, type Department, type DepartmentId, type LocationId, type WarningKind } from "@/lib/data"
import { FigmaIcon, VDivider } from "./figma-icon"

/** Shared recipe for the white 30px toolbar controls (Figma: p-8, r-7, soft ring). */
const CONTROL =
  "tl-press flex h-[30px] shrink-0 items-center justify-center gap-0.5 overflow-hidden rounded-[7px] bg-white p-2 shadow-(--tl-shadow-card) outline-none focus-visible:outline-2 focus-visible:outline-(--ring-focus)"

type ScheduleToolbarProps = {
  weekStart: Date
  onWeekChange: (d: Date) => void
  conflicts: number
  overtime: number
  highlight: WarningKind | null
  onHighlight: (kind: WarningKind | null) => void
  onFixWarnings: () => void
  published: boolean
  onPublish: () => void
  location: LocationId | "all"
  onLocationChange: (l: LocationId | "all") => void
  department: DepartmentId | "all"
  onDepartmentChange: (d: DepartmentId | "all") => void
  /** live departments (names can be edited) */
  departments: Department[]
  /** feedback popover (also opened from the phone top bar menu) */
  feedbackOpen: boolean
  onFeedbackOpenChange: (open: boolean) => void
}

/** Figma 1:9974 — date range, shift warnings, publish; dashed rule; filters + feedback. */
export function ScheduleToolbar(props: ScheduleToolbarProps) {
  const {
    weekStart,
    onWeekChange,
    conflicts,
    overtime,
    highlight,
    onHighlight,
    onFixWarnings,
    published,
    onPublish,
    location,
    onLocationChange,
    department,
    onDepartmentChange,
    departments,
    feedbackOpen,
    onFeedbackOpenChange,
  } = props
  const hasWarnings = conflicts + overtime > 0
  const locationLabel = location === "all" ? "Acme Inc." : LOCATIONS.find((l) => l.id === location)!.name
  const departmentLabel =
    department === "all" ? "All Departments" : departments.find((d) => d.id === department)!.name

  return (
    <div className="flex flex-col gap-[11px]">
      <div className="flex items-center justify-between gap-x-2 max-xl:flex-wrap max-xl:gap-y-2">
        {/* < md: week, warnings and filters live behind one button */}
        <FiltersSheet {...props} />

        <div className="flex items-center gap-2 max-md:hidden max-xl:flex-wrap">
          <WeekPicker weekStart={weekStart} onWeekChange={onWeekChange} />

          <VDivider />

          <div className="flex items-center gap-0.5">
            <FigmaIcon src="/figma/icons/alert-triangle.svg" />
            <span className="px-0.5 text-sm font-medium whitespace-nowrap text-(--tl-fg-body)">Shift Warnings</span>
          </div>

          {hasWarnings ? (
            <>
              {conflicts > 0 && (
                <WarningChip
                  label={`${conflicts} ${conflicts === 1 ? "Conflict" : "Conflicts"}`}
                  pressed={highlight === "conflict"}
                  onClick={() => onHighlight(highlight === "conflict" ? null : "conflict")}
                />
              )}
              {overtime > 0 && (
                <WarningChip
                  label={`${overtime} Overtime`}
                  pressed={highlight === "overtime"}
                  onClick={() => onHighlight(highlight === "overtime" ? null : "overtime")}
                />
              )}
              <button
                type="button"
                onClick={onFixWarnings}
                className="cursor-pointer rounded-sm px-0.5 text-sm font-medium whitespace-nowrap text-(--tl-fg-link) underline decoration-dotted decoration-[7%] underline-offset-[3px] transition-colors duration-(--duration-press) outline-none hover:text-(--tl-fg-button) focus-visible:outline-2 focus-visible:outline-(--ring-focus)"
              >
                Fix warnings
              </button>
            </>
          ) : (
            <span className="tl-enter flex h-[30px] items-center gap-1 rounded-[7px] bg-[rgba(16,185,130,0.06)] px-2.5 text-sm font-medium whitespace-nowrap text-[#0f9e70] shadow-[0px_0px_0px_1px_rgba(16,185,130,0.16)]">
              <CheckIcon className="size-3.5" strokeWidth={2.2} />
              No warnings
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 max-xl:ml-auto">
          <div className="flex items-center gap-2 max-md:gap-6 max-md:px-3">
            <Tooltip>
              <TooltipTrigger
                className="tl-icon-btn size-3.5"
                aria-label="Copy last week's schedule"
              >
                <FigmaIcon src="/figma/icons/copy-06.svg" />
              </TooltipTrigger>
              <TooltipContent>Copy last week</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                className="tl-icon-btn size-3.5"
                aria-label="Schedule rules"
                onClick={() => toast("Schedule rules", { description: "Max 40 hrs/week · 10 hrs rest between shifts" })}
              >
                <FigmaIcon src="/figma/icons/tool-01.svg" />
              </TooltipTrigger>
              <TooltipContent>Schedule rules</TooltipContent>
            </Tooltip>
          </div>
          <VDivider className="max-md:hidden" />
          <button
            type="button"
            onClick={onPublish}
            className="tl-press tl-press-dark flex h-[30px] max-md:h-10 max-md:px-3 items-center justify-center gap-0.5 overflow-hidden rounded-[7px] bg-(--tl-publish) p-2 shadow-(--tl-shadow-card) outline-none focus-visible:outline-2 focus-visible:outline-(--ring-focus)"
          >
            <span className="flex size-3.5 items-center justify-center overflow-hidden">
              {published ? (
                <CheckIcon className="size-3.5 text-white" strokeWidth={2.4} />
              ) : (
                <FigmaIcon src="/figma/icons/send-01.svg" />
              )}
            </span>
            <span className="px-0.5 text-sm font-medium whitespace-nowrap text-white">
              {published ? "Published" : <>Publish<span className="max-md:hidden"> schedule</span></>}
            </span>
          </button>
        </div>
      </div>

      {/* Dashed rule — Figma vector 1:10017 */}
      <div aria-hidden className="h-px w-full overflow-hidden max-md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/icons/toolbar-divider.svg" alt="" width={1145} height={1} className="block max-w-none" />
      </div>

      <div className="flex items-center justify-between max-md:hidden">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className={CONTROL}>
              <FigmaIcon src="/figma/icons/marker-pin-01.svg" />
              <span className="px-0.5 text-sm font-medium whitespace-nowrap text-(--tl-fg-body)">{locationLabel}</span>
              <FigmaIcon src="/figma/icons/chevron-down.svg" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" sideOffset={6}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Location</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={location} onValueChange={(v) => onLocationChange(v as LocationId | "all")}>
                  <DropdownMenuRadioItem value="all">All locations</DropdownMenuRadioItem>
                  {LOCATIONS.map((l) => (
                    <DropdownMenuRadioItem key={l.id} value={l.id}>
                      {l.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className={CONTROL}>
              <FigmaIcon src="/figma/icons/layers-two-02.svg" />
              <span className="px-0.5 text-sm font-medium whitespace-nowrap text-(--tl-fg-body)">{departmentLabel}</span>
              <FigmaIcon src="/figma/icons/chevron-down.svg" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" sideOffset={6}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Department</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={department}
                  onValueChange={(v) => onDepartmentChange(v as DepartmentId | "all")}
                >
                  <DropdownMenuRadioItem value="all">All Departments</DropdownMenuRadioItem>
                  {departments.map((d) => (
                    <DropdownMenuRadioItem key={d.id} value={d.id}>
                      <span className="size-2 rounded-full" style={{ backgroundColor: d.accent }} />
                      {d.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <FeedbackButton open={feedbackOpen} onOpenChange={onFeedbackOpenChange} />
      </div>
    </div>
  )
}

function WarningChip({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-pressed={pressed}
        onClick={onClick}
        className="tl-press tl-press-danger flex h-[30px] items-center justify-center overflow-hidden rounded-[7px] bg-(--tl-danger-bg) p-2 shadow-[0px_0px_0px_1px_var(--tl-danger-ring)] outline-none focus-visible:outline-2 focus-visible:outline-(--ring-focus)"
      >
        <span className="px-0.5 text-sm font-medium whitespace-nowrap text-(--tl-danger)">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{pressed ? "Show all shifts" : "Highlight affected shifts"}</TooltipContent>
    </Tooltip>
  )
}

function WeekPicker({ weekStart, onWeekChange }: { weekStart: Date; onWeekChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false)
  const weekEnd = addDays(weekStart, 6)
  const isBase = isSameDay(weekStart, BASE_WEEK_START)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={CONTROL} aria-label={`Week of ${format(weekStart, "MMMM d, yyyy")}. Change week`}>
        <span className="flex size-3.5 items-center justify-center">
          <FigmaIcon src="/figma/icons/calendar-toolbar.svg" size={15} />
        </span>
        <span className="flex items-center justify-center gap-1 px-0.5">
          <span className="text-sm font-medium whitespace-nowrap text-(--tl-fg-body) tabular-nums">
            {format(weekStart, "MMM d, yyyy")}
          </span>
          <FigmaIcon src="/figma/icons/arrow-narrow-right.svg" />
          <span className="text-sm font-medium whitespace-nowrap text-(--tl-fg-body) tabular-nums">
            {format(weekEnd, "MMM d, yyyy")}
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-auto gap-2 p-2">
        <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => onWeekChange(addWeeks(weekStart, -1))}
            className="tl-press flex size-7 items-center justify-center rounded-md shadow-(--tl-shadow-chip)"
          >
            <ChevronLeftIcon className="size-4 text-(--tl-fg-legend)" />
          </button>
          <span className="text-[13px] font-medium tracking-[-0.01em] text-(--tl-fg-strong) tabular-nums">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </span>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => onWeekChange(addWeeks(weekStart, 1))}
            className="tl-press flex size-7 items-center justify-center rounded-md shadow-(--tl-shadow-chip)"
          >
            <ChevronRightIcon className="size-4 text-(--tl-fg-legend)" />
          </button>
        </div>
        <Calendar
          mode="range"
          weekStartsOn={0}
          selected={{ from: weekStart, to: weekEnd }}
          defaultMonth={weekStart}
          onDayClick={(day) => {
            onWeekChange(startOfWeek(day, { weekStartsOn: 0 }))
            setOpen(false)
          }}
          className="p-0"
        />
        <button
          type="button"
          disabled={isBase}
          onClick={() => {
            onWeekChange(BASE_WEEK_START)
            setOpen(false)
          }}
          className={cn(
            "tl-press h-7 rounded-md text-[13px] font-medium tracking-[-0.01em] text-(--tl-fg-button) shadow-(--tl-shadow-chip)",
            "disabled:cursor-default disabled:opacity-50"
          )}
        >
          Back to current week
        </button>
      </PopoverContent>
    </Popover>
  )
}

function FeedbackButton({ open, onOpenChange: setOpen }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [text, setText] = useState("")
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(CONTROL, "bg-[rgba(255,255,255,0.1)]")}>
        <span className="flex size-3.5 items-center justify-center">
          <FigmaIcon src="/figma/icons/chat.svg" size={15} />
        </span>
        <span className="px-0.5 text-sm font-medium whitespace-nowrap text-(--tl-fg-button)">Feedback</span>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-72 gap-2 p-2.5" title="Feedback">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return
            toast.success("Thanks for the feedback!")
            setText("")
            setOpen(false)
          }}
        >
          <label htmlFor="tl-feedback" className="text-[13px] font-medium tracking-[-0.01em] text-(--tl-fg-strong)">
            Share feedback on Timelines
          </label>
          <textarea
            id="tl-feedback"
            autoFocus
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What could be better?"
            className="resize-none rounded-md bg-white p-2 text-[13px] leading-[1.4] tracking-[-0.01em] text-(--tl-fg-strong) shadow-(--tl-shadow-chip) outline-none placeholder:text-(--tl-fg-placeholder) focus:shadow-[0px_0px_0px_1px_#d4d4d4,0px_0px_0px_3px_rgba(16,103,255,0.14)]"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="tl-press tl-press-dark h-[30px] self-end rounded-[7px] bg-(--tl-publish) px-3 text-sm font-medium text-white disabled:cursor-default disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </PopoverContent>
    </Popover>
  )
}

/** Phone-only "Filters" button: week, warnings, location and department in one sheet. */
function FiltersSheet(props: ScheduleToolbarProps) {
  const {
    weekStart,
    onWeekChange,
    conflicts,
    overtime,
    highlight,
    onHighlight,
    onFixWarnings,
    location,
    onLocationChange,
    department,
    onDepartmentChange,
    departments,
  } = props
  const [open, setOpen] = useState(false)
  const isBase = isSameDay(weekStart, BASE_WEEK_START)
  const active = Number(!isBase) + Number(location !== "all") + Number(department !== "all") + Number(!!highlight)
  const warnings = conflicts + overtime

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(CONTROL, "h-10 gap-1.5 px-3 md:hidden")}>
        <FigmaIcon src="/figma/icons/filter-lines.svg" />
        <span className="text-sm font-medium whitespace-nowrap text-(--tl-fg-body)">Filters</span>
        {active > 0 && (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--tl-publish) px-1 text-[11px] font-semibold text-white tabular-nums">
            {active}
          </span>
        )}
        {warnings > 0 && (
          <span aria-label={`${warnings} shift warnings`} className="size-1.5 rounded-full bg-(--tl-danger)" />
        )}
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-80 gap-4 p-3" title="Filters">
        <div className="flex items-center justify-between">
          <p className="text-base font-medium text-(--tl-fg-strong)">Filters</p>
          <button
            type="button"
            disabled={active === 0}
            onClick={() => {
              onWeekChange(BASE_WEEK_START)
              onLocationChange("all")
              onDepartmentChange("all")
              onHighlight(null)
            }}
            className="h-10 rounded-md px-2 text-sm font-medium text-(--tl-fg-link) disabled:opacity-40"
          >
            Reset
          </button>
        </div>

        <FilterSection label="Week">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => onWeekChange(addWeeks(weekStart, -1))}
              className="tl-press flex size-10 items-center justify-center rounded-lg shadow-(--tl-shadow-chip)"
            >
              <ChevronLeftIcon className="size-4 text-(--tl-fg-legend)" />
            </button>
            <span className="flex-1 text-center text-sm font-medium text-(--tl-fg-strong) tabular-nums">
              {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </span>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => onWeekChange(addWeeks(weekStart, 1))}
              className="tl-press flex size-10 items-center justify-center rounded-lg shadow-(--tl-shadow-chip)"
            >
              <ChevronRightIcon className="size-4 text-(--tl-fg-legend)" />
            </button>
          </div>
          {!isBase && (
            <button
              type="button"
              onClick={() => onWeekChange(BASE_WEEK_START)}
              className="tl-press h-10 rounded-lg text-sm font-medium text-(--tl-fg-button) shadow-(--tl-shadow-chip)"
            >
              Back to current week
            </button>
          )}
        </FilterSection>

        <FilterSection label="Shift warnings">
          {warnings > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {conflicts > 0 && (
                <WarningChip
                  label={`${conflicts} ${conflicts === 1 ? "Conflict" : "Conflicts"}`}
                  pressed={highlight === "conflict"}
                  onClick={() => onHighlight(highlight === "conflict" ? null : "conflict")}
                />
              )}
              {overtime > 0 && (
                <WarningChip
                  label={`${overtime} Overtime`}
                  pressed={highlight === "overtime"}
                  onClick={() => onHighlight(highlight === "overtime" ? null : "overtime")}
                />
              )}
              <button
                type="button"
                onClick={onFixWarnings}
                className="h-10 px-1 text-sm font-medium text-(--tl-fg-link) underline decoration-dotted underline-offset-[3px]"
              >
                Fix warnings
              </button>
            </div>
          ) : (
            <span className="flex items-center gap-1 text-sm font-medium text-[#0f9e70]">
              <CheckIcon className="size-3.5" strokeWidth={2.2} />
              No warnings
            </span>
          )}
        </FilterSection>

        <FilterSection label="Location">
          <Segmented
            value={location}
            onChange={(v) => onLocationChange(v as LocationId | "all")}
            options={[{ value: "all", label: "All locations" }, ...LOCATIONS.map((l) => ({ value: l.id, label: l.name }))]}
          />
        </FilterSection>

        <FilterSection label="Department">
          <Segmented
            value={department}
            onChange={(v) => onDepartmentChange(v as DepartmentId | "all")}
            options={[{ value: "all", label: "All" }, ...departments.map((d) => ({ value: d.id, label: d.name, dot: d.accent }))]}
          />
        </FilterSection>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="tl-press tl-press-dark h-11 rounded-lg bg-(--tl-publish) text-sm font-medium text-white"
        >
          Done
        </button>
      </PopoverContent>
    </Popover>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs font-medium text-(--tl-fg-legend)">{label}</p>
      {children}
    </section>
  )
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; dot?: string }[]
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "tl-press flex h-10 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-medium text-(--tl-fg-body) shadow-(--tl-shadow-chip)",
              on && "bg-(--tl-nav-active)! text-(--tl-fg-strong) shadow-[0px_0px_0px_1px_#cfcfcf]"
            )}
          >
            {o.dot && <span className="size-2 rounded-full" style={{ backgroundColor: o.dot }} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
