/**
 * Mock data for the Timelines prototype.
 * Source: Figma "Business scheduling platform" (file ZKxOvLKOz4VYG21iEqjG4l, node 1:9814).
 *
 * Everything is a weekly template: shifts are positioned by day index
 * (0 = Mon … 6 = Sun) and the schedule grid lays them out with CSS grid.
 */

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

/** First day of the week shown in Figma ("Sep 28, 2025 → Oct 4, 2025"). */
export const BASE_WEEK_START = new Date(2025, 8, 28)

export type LocationId = "downtown" | "harbor"
export type DepartmentId = "cook" | "barista"

export const LOCATIONS: { id: LocationId; name: string }[] = [
  { id: "downtown", name: "Acme Downtown" },
  { id: "harbor", name: "Acme Harbor" },
]

export type Department = {
  id: DepartmentId
  name: string
  /** accent hex used for the badge, shift bars, connectors and legend */
  accent: string
  /** 10px white glyph inside the 16px badge */
  icon: string
  legendSwitchIcon: string
  legendCoverIcon: string
}

export const DEPARTMENTS: Department[] = [
  {
    id: "cook",
    name: "Cook Department",
    accent: "#8b55f3",
    icon: "/figma/icons/layers-two-02-white.svg",
    legendSwitchIcon: "/figma/icons/legend-circle.svg",
    legendCoverIcon: "/figma/icons/legend-triangle.svg",
  },
  {
    id: "barista",
    name: "Barista Division",
    accent: "#10b982",
    icon: "/figma/icons/user-01-white.svg",
    legendSwitchIcon: "/figma/icons/legend-circle-green.svg",
    legendCoverIcon: "/figma/icons/legend-triangle-green.svg",
  },
]

export type Employee = {
  id: string
  name: string
  /** avatar image; null renders initials */
  avatar: string | null
  role: string
  /** weekly hours shown in Figma for the seed schedule (live totals come from lib/schedule.ts) */
  hours: number
  /** weekly hour limit used for overtime warnings (default 40) */
  limit?: number
  departmentId: DepartmentId
  location: LocationId
  /** days off — hatched grey cell with an OFF chip */
  off: DayIndex[]
  /** sick days — hatched amber cell */
  sick: DayIndex[]
}

export const EMPLOYEES: Employee[] = [
  // Cook Department
  { id: "leonard-kim", name: "Leonard Kim", avatar: "/figma/avatars/leonard-kim.png", role: "Regular Shift", hours: 35, limit: 32, departmentId: "cook", location: "downtown", off: [6], sick: [5] },
  { id: "james-park", name: "James Park", avatar: "/figma/avatars/james-park.png", role: "Support Cook", hours: 25, departmentId: "cook", location: "harbor", off: [6], sick: [] },
  { id: "mina-choi", name: "Mina Choi", avatar: "/figma/avatars/mina-choi.png", role: "Evening Line Cook", hours: 20, departmentId: "cook", location: "downtown", off: [0, 2], sick: [] },
  { id: "david-lim", name: "David Lim", avatar: "/figma/avatars/david-lim.png", role: "Prep Cook", hours: 18, departmentId: "cook", location: "harbor", off: [], sick: [3, 4] },
  // Barista Division
  { id: "sophie-tan", name: "Sophie Tan", avatar: "/figma/avatars/sophie-tan.png", role: "Senior Barista", hours: 34, limit: 32, departmentId: "barista", location: "downtown", off: [6], sick: [] },
  { id: "ryan-lee", name: "Ryan Lee", avatar: "/figma/avatars/ryan-lee.png", role: "Junior Barista", hours: 20, departmentId: "barista", location: "harbor", off: [1], sick: [0] },
  { id: "hannah-kim", name: "Hannah Kim", avatar: "/figma/avatars/hannah-kim.png", role: "Barista", hours: 25, departmentId: "barista", location: "downtown", off: [6], sick: [5] },
  { id: "david-park", name: "David Park", avatar: "/figma/avatars/david-park.svg", role: "Part-time Barista", hours: 15, departmentId: "barista", location: "harbor", off: [5], sick: [] },
]

export type Shift = {
  id: string
  employeeId: string
  start: DayIndex
  /** inclusive */
  end: DayIndex
  /** text on the bar (Figma copy) */
  label: string
  /** full name used in tooltip / popover */
  title: string
  startTime: string
  endTime: string
  /** hours per day */
  hoursPerDay: number
  /** shift runs into next week — bar hugs its text and is clipped by the grid edge */
  continues?: boolean
}

export const SHIFTS: Shift[] = [
  // Cook Department
  { id: "sh-leonard-1", employeeId: "leonard-kim", start: 0, end: 3, label: "Morning & Afternoon Shifts (8:00 AM – 4:00 PM)", title: "Morning & Afternoon Shifts", startTime: "8:00 AM", endTime: "4:00 PM", hoursPerDay: 8 },
  { id: "sh-james-1", employeeId: "james-park", start: 1, end: 4, label: "Midday Support (10:00 AM – 3:00 PM)", title: "Midday Support", startTime: "10:00 AM", endTime: "3:00 PM", hoursPerDay: 5 },
  { id: "sh-james-2", employeeId: "james-park", start: 5, end: 6, label: "Short Evening Shift (5:00 PM – 9:00 PM)", title: "Short Evening Shift", startTime: "5:00 PM", endTime: "9:00 PM", hoursPerDay: 4, continues: true },
  { id: "sh-mina-1", employeeId: "mina-choi", start: 1, end: 1, label: "Evening Shifts", title: "Evening Shifts", startTime: "4:00 PM", endTime: "9:00 PM", hoursPerDay: 5 },
  { id: "sh-mina-2", employeeId: "mina-choi", start: 3, end: 6, label: "Evening Shifts (4:00 PM – 9:00 PM)", title: "Evening Shifts", startTime: "4:00 PM", endTime: "9:00 PM", hoursPerDay: 5 },
  { id: "sh-david-1", employeeId: "david-lim", start: 0, end: 2, label: "Early Prep (6:00 AM – 12:00 PM)", title: "Early Prep", startTime: "6:00 AM", endTime: "12:00 PM", hoursPerDay: 6 },
  { id: "sh-david-2", employeeId: "david-lim", start: 5, end: 6, label: "Evening Shifts (4:00 PM – 9:00 PM)", title: "Evening Shifts", startTime: "4:00 PM", endTime: "9:00 PM", hoursPerDay: 5, continues: true },
  // Barista Division
  { id: "sh-sophie-1", employeeId: "sophie-tan", start: 0, end: 3, label: "Morning & Afternoon (7:00 AM – 3:00 PM)", title: "Morning & Afternoon", startTime: "7:00 AM", endTime: "3:00 PM", hoursPerDay: 8 },
  { id: "sh-sophie-2", employeeId: "sophie-tan", start: 4, end: 5, label: "Evenings (5:00 PM – 11:00 PM)", title: "Evenings", startTime: "5:00 PM", endTime: "11:00 PM", hoursPerDay: 6 },
  { id: "sh-ryan-1", employeeId: "ryan-lee", start: 2, end: 4, label: "Afternoon (12:00 PM – 6:00 PM)", title: "Afternoon", startTime: "12:00 PM", endTime: "6:00 PM", hoursPerDay: 6 },
  { id: "sh-ryan-2", employeeId: "ryan-lee", start: 5, end: 6, label: "Morning & Afternoon (7:00 AM – 3:00 PM)", title: "Morning & Afternoon", startTime: "7:00 AM", endTime: "3:00 PM", hoursPerDay: 8, continues: true },
  { id: "sh-hannah-1", employeeId: "hannah-kim", start: 0, end: 1, label: "Afternoon (12:00 PM – 6:00 PM)", title: "Afternoon", startTime: "12:00 PM", endTime: "6:00 PM", hoursPerDay: 6 },
  { id: "sh-hannah-2", employeeId: "hannah-kim", start: 2, end: 4, label: "Evening Shift (3:00 PM – 9:00 PM)", title: "Evening Shift", startTime: "3:00 PM", endTime: "9:00 PM", hoursPerDay: 6 },
  { id: "sh-dpark-1", employeeId: "david-park", start: 0, end: 4, label: "Morning Shift (7:00 AM – 12:00 PM)", title: "Morning Shift", startTime: "7:00 AM", endTime: "12:00 PM", hoursPerDay: 5 },
]

export type ConnectorKind = "switch" | "cover"

/**
 * Curved links between shifts — exact Figma-exported vectors.
 * Each SVG is drawn rotated 180° (as in Figma). Its bounding box is placed
 * relative to an anchor: the left edge of `anchorShiftId`'s bar (day start + 7px)
 * at the vertical centre of that shift's row. dx/dy are measured in Figma.
 */
export type Connector = {
  id: string
  kind: ConnectorKind
  fromShiftId: string
  toShiftId: string
  anchorShiftId: string
  src: string
  width: number
  height: number
  dx: number
  dy: number
}

export const CONNECTORS: Connector[] = [
  {
    id: "cn-cook-cover",
    kind: "cover",
    fromShiftId: "sh-james-1",
    toShiftId: "sh-mina-1",
    anchorShiftId: "sh-mina-1",
    src: "/figma/connectors/cook-line-1.svg",
    width: 42.7,
    height: 89.7414,
    dx: -43.84,
    dy: -85.7,
  },
  {
    id: "cn-cook-switch",
    kind: "switch",
    fromShiftId: "sh-david-1",
    toShiftId: "sh-mina-2",
    anchorShiftId: "sh-mina-2",
    src: "/figma/connectors/cook-line-2.svg",
    width: 22.9748,
    height: 89.8876,
    dx: -19.66,
    dy: -0.65,
  },
  {
    id: "cn-barista-switch",
    kind: "switch",
    fromShiftId: "sh-sophie-2",
    toShiftId: "sh-ryan-2",
    anchorShiftId: "sh-ryan-2",
    src: "/figma/connectors/barista-line-2.svg",
    width: 132.694,
    height: 88.8878,
    dx: -13.51,
    dy: -85.65,
  },
  {
    id: "cn-barista-cover",
    kind: "cover",
    fromShiftId: "sh-hannah-2",
    toShiftId: "sh-dpark-1",
    anchorShiftId: "sh-hannah-2",
    src: "/figma/connectors/barista-line-3.svg",
    width: 12.6233,
    height: 70.7532,
    dx: -12.83,
    dy: -0.76,
  },
]

export type WarningKind = "conflict" | "overtime"

export type ShiftWarning = { shiftId: string; kind: WarningKind; message: string }

/** Only the base week (Sep 28 – Oct 4) has open warnings. */
export const WARNINGS: ShiftWarning[] = [
  { shiftId: "sh-james-2", kind: "conflict", message: "Runs into James's day off on Sunday" },
  { shiftId: "sh-mina-1", kind: "conflict", message: "Covers a shift on a day Mina is marked unavailable" },
  { shiftId: "sh-david-2", kind: "conflict", message: "Scheduled straight after two sick days" },
  { shiftId: "sh-leonard-1", kind: "overtime", message: "Pushes Leonard 3 hrs past his weekly limit" },
  { shiftId: "sh-sophie-1", kind: "overtime", message: "Pushes Sophie 2 hrs past her weekly limit" },
]

/* -------------------------------------------------------------------------- */
/* Sidebar navigation                                                          */
/* -------------------------------------------------------------------------- */

export type NavItem = { id: string; label: string; icon: string }

const icon = (name: string) => `/figma/icons/${name}.svg`

export const NAV_TOP: NavItem[] = [
  { id: "explore", label: "Explore", icon: icon("search-sm") },
  { id: "settings", label: "Settings", icon: icon("settings-01") },
  { id: "resources", label: "Resources", icon: icon("attachment-01") },
]

export const NAV_MAIN: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: icon("grid-01-nav") },
  { id: "timelines", label: "Timelines", icon: icon("calendar-nav") },
]

export const NAV_REPORTS: NavItem = { id: "reports", label: "Reports", icon: icon("file-attachment-04") }

export const NAV_REPORTS_CHILDREN: NavItem[] = [
  { id: "all-reports", label: "All Reports", icon: icon("book-closed") },
  { id: "performance-trends", label: "Performance Trends", icon: icon("line-chart-up-03") },
  { id: "growth-scenarios", label: "Growth Scenarios", icon: icon("rocket-02") },
  { id: "project-impact", label: "Project Impact", icon: icon("pencil-01") },
  { id: "hiring-threshold", label: "Hiring Threshold", icon: icon("bar-chart-12") },
]

export const NAV_WORK: NavItem[] = [
  { id: "workflows", label: "Workflows", icon: icon("refresh-ccw-05") },
  { id: "projects", label: "Projects", icon: icon("folder") },
  { id: "documents", label: "Documents", icon: icon("file-06") },
  { id: "locations", label: "Locations", icon: icon("marker-pin-04") },
  { id: "action-items", label: "Action Items", icon: icon("cursor-click-02") },
]

export const NAV_FOOTER: NavItem[] = [
  { id: "preferences", label: "Preferences", icon: icon("settings-04") },
  { id: "invite", label: "Invite Members", icon: icon("users-plus") },
  { id: "help", label: "Help & Support", icon: icon("help-circle-nav") },
]

export const WORKSPACES = ["Acme Inc.", "Acme Labs", "Northwind Cafe"] as const
