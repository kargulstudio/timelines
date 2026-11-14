"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { addDays, format, isSameDay } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { BREAKPOINTS, useMediaQuery } from "@/lib/use-media-query"
import { computeWarnings, formatHours, shiftHours, weeklyHours, type DayStatus } from "@/lib/schedule"
import {
  BASE_WEEK_START,
  CONNECTORS,
  DAY_NAMES,
  DEPARTMENTS,
  EMPLOYEES,
  SHIFTS,
  type DayIndex,
  type Department,
  type DepartmentId,
  type Employee,
  type LocationId,
  type Shift,
  type ShiftWarning,
  type WarningKind,
} from "@/lib/data"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { ScheduleToolbar } from "./schedule-toolbar"
import { DepartmentCard, type SortMode } from "./department-card"

/** Figma 1:9814 — "Business scheduling platform" (1440×1024). */
export function TimelinesApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState<LocationId | "all">("all")
  const [department, setDepartment] = useState<DepartmentId | "all">("all")
  const [weekStart, setWeekStart] = useState(BASE_WEEK_START)
  const [departments, setDepartments] = useState<Department[]>(DEPARTMENTS)
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES)
  const [shifts, setShifts] = useState<Shift[]>(SHIFTS)
  /** shifts created, moved or retimed — their warnings are re-checked instead of using the Figma copy */
  const [touched, setTouched] = useState<Set<string>>(() => new Set())
  const [resolved, setResolved] = useState<Set<string>>(() => new Set())
  const [highlight, setHighlight] = useState<WarningKind | null>(null)
  const [published, setPublished] = useState(false)
  const [sort, setSort] = useState<Record<DepartmentId, SortMode>>({ cook: "default", barista: "default" })
  const [addOpenFor, setAddOpenFor] = useState<DepartmentId | null>(null)
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set())
  const searchRef = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)
  // < lg: the sidebar is an off-canvas drawer opened from the top bar
  const isDesktop = useMediaQuery(BREAKPOINTS.lg)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const mobileOpen = drawerOpen && !isDesktop
  // < md: search collapses to an icon; feedback opens from the top bar's "…" menu
  const [searchOpen, setSearchOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const isBaseWeek = isSameDay(weekStart, BASE_WEEK_START)

  // "/" focuses search from anywhere (except while typing in another field)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return
      e.preventDefault()
      setSearchOpen(true)
      // the field may only appear after this render (collapsed search on phones)
      requestAnimationFrame(() => {
        searchRef.current?.focus()
        searchRef.current?.select()
      })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Esc closes the drawer
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mobileOpen])

  /* ------------------------------ warnings ------------------------------ */
  const hours = useMemo(() => weeklyHours(employees, shifts), [employees, shifts])
  // Only the base week (Sep 28 – Oct 4) is checked, as in Figma; sick days only exist there.
  const openWarnings = useMemo(() => {
    if (!isBaseWeek) return [] as ShiftWarning[]
    return computeWarnings(employees, shifts, touched, hours, isBaseWeek).filter((w) => !resolved.has(w.shiftId))
  }, [isBaseWeek, employees, shifts, touched, hours, resolved])
  const warningMap = useMemo(() => new Map(openWarnings.map((w) => [w.shiftId, w])), [openWarnings])
  const conflicts = openWarnings.filter((w) => w.kind === "conflict").length
  const overtime = openWarnings.filter((w) => w.kind === "overtime").length
  // a highlight mode with nothing left to highlight switches itself off
  const effectiveHighlight =
    highlight && openWarnings.some((w) => w.kind === highlight) ? highlight : null

  function markDirty() {
    setPublished(false)
  }

  function resolveIds(ids: string[], message: string) {
    if (ids.length === 0) return
    setResolved((prev) => new Set([...prev, ...ids]))
    setHighlight(null)
    markDirty()
    toast.success(message, {
      action: {
        label: "Undo",
        onClick: () =>
          setResolved((prev) => {
            const next = new Set(prev)
            ids.forEach((id) => next.delete(id))
            return next
          }),
      },
    })
  }

  function fixAll() {
    const parts = [
      conflicts && `${conflicts} ${conflicts === 1 ? "conflict" : "conflicts"}`,
      overtime && `${overtime} overtime ${overtime === 1 ? "warning" : "warnings"}`,
    ].filter(Boolean)
    resolveIds(
      openWarnings.map((w) => w.shiftId),
      `Resolved ${parts.join(" and ")}`
    )
  }

  function publish() {
    const range = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d")}`
    const doPublish = () => {
      setPublished(true)
      toast.success("Schedule published", { description: `${range} · shared with ${employees.length} employees` })
    }
    if (openWarnings.length > 0) {
      toast.warning(`${openWarnings.length} shift warnings are still open`, {
        description: "Fix them first, or publish anyway.",
        action: { label: "Publish anyway", onClick: doPublish },
      })
      return
    }
    doPublish()
  }

  function removeShift(shift: Shift) {
    setShifts((prev) => prev.filter((s) => s.id !== shift.id))
    markDirty()
    toast(`Removed “${shift.title}”`, {
      action: { label: "Undo", onClick: () => setShifts((prev) => [...prev, shift]) },
    })
  }

  function saveShift(next: Shift, prev?: Shift, message?: string) {
    const shift = prev ? next : { ...next, id: `sh-new-${nextId.current++}` }
    const retimed =
      !prev ||
      prev.start !== shift.start ||
      prev.end !== shift.end ||
      prev.startTime !== shift.startTime ||
      prev.endTime !== shift.endTime
    setShifts((list) => (prev ? list.map((s) => (s.id === prev.id ? shift : s)) : [...list, shift]))
    if (retimed) {
      setTouched((t) => new Set(t).add(shift.id))
      // an edited shift gets a fresh look from the warning checks
      setResolved((r) => {
        if (!r.has(shift.id)) return r
        const n = new Set(r)
        n.delete(shift.id)
        return n
      })
    }
    markDirty()
    const first = employees.find((e) => e.id === shift.employeeId)?.name.split(" ")[0] ?? ""
    toast(message ?? (prev ? `Updated “${shift.title}”` : `Added “${shift.title}” for ${first}`), {
      id: "shift-change",
      description: `${formatHours(shiftHours(shift))} hrs this week`,
      action: {
        label: "Undo",
        onClick: () =>
          setShifts((list) =>
            prev ? list.map((s) => (s.id === shift.id ? prev : s)) : list.filter((s) => s.id !== shift.id)
          ),
      },
    })
  }

  function setDayStatus(employeeId: string, day: DayIndex, status: DayStatus | null) {
    const before = employees.find((e) => e.id === employeeId)
    if (!before) return
    const apply = (e: Employee): Employee => ({
      ...e,
      off: status === "off" ? [...e.off.filter((d) => d !== day), day].sort() : e.off.filter((d) => d !== day),
      sick: status === "sick" ? [...e.sick.filter((d) => d !== day), day].sort() : e.sick.filter((d) => d !== day),
    })
    setEmployees((list) => list.map((e) => (e.id === employeeId ? apply(e) : e)))
    // shifts on that day are re-checked against the new availability
    const affected = shifts.filter((s) => s.employeeId === employeeId && s.start <= day && s.end >= day)
    if (affected.length) setTouched((t) => new Set([...t, ...affected.map((s) => s.id)]))
    markDirty()
    const first = before.name.split(" ")[0]
    const wasSick = before.sick.includes(day)
    const message =
      status === "off"
        ? `${first} is off on ${DAY_NAMES[day]}`
        : status === "sick"
          ? `${first} is out sick on ${DAY_NAMES[day]}`
          : `Cleared ${first}'s ${wasSick ? "sick day" : "day off"} on ${DAY_NAMES[day]}`
    toast(message, {
      id: "day-status",
      action: {
        label: "Undo",
        onClick: () =>
          setEmployees((list) =>
            list.map((e) => (e.id === employeeId ? { ...e, off: before.off, sick: before.sick } : e))
          ),
      },
    })
  }

  function renameDepartment(id: DepartmentId, name: string) {
    const before = departments.find((d) => d.id === id)
    if (!before || before.name === name) return
    setDepartments((list) => list.map((d) => (d.id === id ? { ...d, name } : d)))
    toast(`Renamed to “${name}”`, {
      id: "rename-department",
      action: {
        label: "Undo",
        onClick: () => setDepartments((list) => list.map((d) => (d.id === id ? { ...d, name: before.name } : d))),
      },
    })
  }

  function removeEmployee(employee: Employee) {
    const index = employees.findIndex((e) => e.id === employee.id)
    const theirShifts = shifts.filter((s) => s.employeeId === employee.id)
    setEmployees((list) => list.filter((e) => e.id !== employee.id))
    setShifts((list) => list.filter((s) => s.employeeId !== employee.id))
    markDirty()
    toast(`Removed ${employee.name}`, {
      description: theirShifts.length
        ? `${theirShifts.length} ${theirShifts.length === 1 ? "shift" : "shifts"} removed with them`
        : undefined,
      action: {
        label: "Undo",
        onClick: () => {
          setEmployees((list) => {
            const next = [...list]
            next.splice(Math.min(index, next.length), 0, employee)
            return next
          })
          setShifts((list) => [...list, ...theirShifts])
        },
      },
    })
  }

  function addEmployee(dept: DepartmentId, name: string, role: string) {
    const id = `new-${nextId.current++}`
    const employee: Employee = {
      id,
      name,
      avatar: null,
      role,
      hours: 0,
      departmentId: dept,
      location: location === "all" ? "downtown" : location,
      off: [],
      sick: [],
    }
    setEmployees((prev) => [...prev, employee])
    setNewIds((prev) => new Set(prev).add(id))
    setAddOpenFor(null)
    markDirty()
    toast.success(`${name} added to ${departments.find((d) => d.id === dept)!.name}`)
  }

  // Only Timelines exists in this prototype; navigating just closes the mobile drawer.
  function navigate() {
    setDrawerOpen(false)
  }

  /* ------------------------------ filtering ----------------------------- */
  const q = query.trim().toLowerCase()
  const visibleDepartments = departments.filter((d) => department === "all" || d.id === department)

  return (
    <div className="timelines flex h-dvh min-h-0 overflow-hidden bg-(--tl-shell)">
      <Sidebar
        active="timelines"
        onNavigate={navigate}
        isDesktop={isDesktop}
        mobileOpen={mobileOpen}
        hiddenOnDesktop={sidebarCollapsed}
        onCollapse={() => (isDesktop ? setSidebarCollapsed(true) : setDrawerOpen(false))}
      />

      {/* Drawer scrim (< lg only) */}
      <div
        aria-hidden
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-(--bg-overlay) transition-opacity duration-(--duration-slow) ease-out-strong lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <main
        inert={mobileOpen}
        className={cn(
          "tl-scroll my-2 mr-2 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-lg bg-(--tl-panel) shadow-(--tl-shadow-panel) max-lg:ml-2",
          sidebarCollapsed && "ml-2"
        )}
      >
        <div className="flex min-h-full flex-col px-6 pt-6 pb-6 max-md:px-4 max-md:pt-4">
          <TopBar
            onOpenMenu={() => setDrawerOpen(true)}
            searchOpen={searchOpen}
            onSearchOpenChange={setSearchOpen}
            onOpenFeedback={() => setFeedbackOpen(true)}
            inputRef={searchRef}
            query={query}
            onQueryChange={setQuery}
            onAddEmployee={() => setAddOpenFor(visibleDepartments[0]?.id ?? "cook")}
            sidebarCollapsed={sidebarCollapsed}
            onExpandSidebar={() => setSidebarCollapsed(false)}
          />

          <div className="mt-8 max-md:mt-5">
            <ScheduleToolbar
              weekStart={weekStart}
              onWeekChange={(d) => {
                setWeekStart(d)
                setHighlight(null)
                markDirty()
              }}
              conflicts={conflicts}
              overtime={overtime}
              highlight={effectiveHighlight}
              onHighlight={setHighlight}
              onFixWarnings={fixAll}
              published={published}
              onPublish={publish}
              location={location}
              onLocationChange={setLocation}
              department={department}
              onDepartmentChange={setDepartment}
              departments={departments}
              feedbackOpen={feedbackOpen}
              onFeedbackOpenChange={setFeedbackOpen}
            />
          </div>

          <div className="mt-5 flex flex-col gap-5 max-md:mt-4 max-md:gap-4">
            {visibleDepartments.map((d) => {
              const deptEmployees = employees.filter((e) => e.departmentId === d.id)
              const defaultOrder = deptEmployees.map((e) => e.id)
              let rows = deptEmployees.filter(
                (e) =>
                  (location === "all" || e.location === location) &&
                  (!q || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q))
              )
              if (sort[d.id] === "name") rows = [...rows].sort((a, b) => a.name.localeCompare(b.name))
              if (sort[d.id] === "hours") rows = [...rows].sort((a, b) => (hours.get(b.id) ?? 0) - (hours.get(a.id) ?? 0))
              const ids = new Set(deptEmployees.map((e) => e.id))
              return (
                <DepartmentCard
                  key={d.id}
                  department={d}
                  employees={rows}
                  defaultOrder={defaultOrder}
                  shifts={shifts.filter((s) => ids.has(s.employeeId))}
                  connectors={CONNECTORS}
                  showSick={isBaseWeek}
                  warnings={warningMap}
                  highlight={effectiveHighlight}
                  newIds={newIds}
                  emptyMessage={q ? `No employees match “${query.trim()}”` : "No employees at this location"}
                  sort={sort[d.id]}
                  onSortChange={(s) => setSort((prev) => ({ ...prev, [d.id]: s }))}
                  addOpen={addOpenFor === d.id}
                  onAddOpenChange={(open) => setAddOpenFor(open ? d.id : null)}
                  onAddEmployee={(name, role) => addEmployee(d.id, name, role)}
                  hours={hours}
                  onRemoveShift={removeShift}
                  onResolve={(id) => resolveIds([id], "Warning resolved")}
                  onSaveShift={saveShift}
                  onSetDayStatus={setDayStatus}
                  onRename={(name) => renameDepartment(d.id, name)}
                  onRemoveEmployee={removeEmployee}
                />
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
