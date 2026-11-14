"use client"

import { useState, type Ref } from "react"
import { MenuIcon, MoreHorizontalIcon, SearchIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/responsive-popover"
import { FigmaIcon, VDivider } from "./figma-icon"

type TopBarProps = {
  query: string
  onQueryChange: (q: string) => void
  onAddEmployee: () => void
  sidebarCollapsed: boolean
  onExpandSidebar: () => void
  inputRef: Ref<HTMLInputElement>
  /** < lg: open the sidebar drawer */
  onOpenMenu: () => void
  /** < md: search is an icon until opened */
  searchOpen: boolean
  onSearchOpenChange: (open: boolean) => void
  /** < md: feedback lives in the "…" menu */
  onOpenFeedback: () => void
}

/** Compact square icon button for the phone top bar (40px touch target). */
const PHONE_ICON_BTN =
  "tl-press tl-press-ghost flex size-10 shrink-0 items-center justify-center rounded-lg text-(--tl-fg-ink) outline-none focus-visible:outline-2 focus-visible:outline-(--ring-focus)"

const NOTIFICATIONS = [
  { id: 1, title: "Mina Choi requested to cover James's Tue shift", time: "2m ago" },
  { id: 2, title: "David Lim reported sick for Thu – Fri", time: "1h ago" },
  { id: 3, title: "Barista schedule for Oct 5 – 11 is ready for review", time: "Yesterday" },
]

/** Figma 1:9947 — search (with "/" shortcut), Add, onboarding flag, inbox, notifications. */
export function TopBar({
  query,
  onQueryChange,
  onAddEmployee,
  sidebarCollapsed,
  onExpandSidebar,
  inputRef,
  onOpenMenu,
  searchOpen,
  onSearchOpenChange,
  onOpenFeedback,
}: TopBarProps) {
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  // on phones the field only shows while open (or while it holds a query)
  const searchExpanded = searchOpen || query.length > 0

  return (
    <div className="flex h-[30px] items-center justify-between gap-2 max-md:h-10">
      <div className={cn("flex min-w-0 items-center gap-3 max-md:gap-1", searchExpanded && "max-md:flex-1")}>
        <button type="button" aria-label="Open menu" onClick={onOpenMenu} className={cn(PHONE_ICON_BTN, "-ml-2 lg:hidden")}>
          <MenuIcon className="size-5" strokeWidth={1.75} />
        </button>
        {!searchExpanded && (
          <button
            type="button"
            aria-label="Search employees"
            onClick={() => {
              onSearchOpenChange(true)
              requestAnimationFrame(() => document.getElementById("tl-search")?.focus())
            }}
            className={cn(PHONE_ICON_BTN, "md:hidden")}
          >
            <SearchIcon className="size-[18px]" strokeWidth={1.75} />
          </button>
        )}
        {sidebarCollapsed && (
          <Tooltip>
            <TooltipTrigger
              className="tl-icon-btn size-3.5 max-lg:hidden"
              aria-label="Expand sidebar"
              onClick={onExpandSidebar}
            >
              <FigmaIcon src="/figma/icons/layout-left.svg" className="-scale-x-100" />
            </TooltipTrigger>
            <TooltipContent>Expand sidebar</TooltipContent>
          </Tooltip>
        )}
        {/* Search — 1:9948 */}
        <label
          className={cn(
            "flex h-[30px] w-[277px] cursor-text items-center gap-0.5 overflow-hidden rounded-md bg-white py-[5px] pr-[5px] pl-2 shadow-(--tl-shadow-field) transition-shadow duration-(--duration-fast) ease-out-strong focus-within:shadow-[0px_2px_4px_-2px_rgba(20,20,20,0.25),0px_0px_0px_1px_#d4d4d4,0px_0px_0px_3px_rgba(16,103,255,0.14)]",
            "max-md:h-10 max-md:w-auto max-md:min-w-0 max-md:flex-1 max-md:pl-3",
            !searchExpanded && "max-md:hidden"
          )}
        >
          <FigmaIcon src="/figma/icons/search-md.svg" />
          <span className="flex min-w-0 flex-1 items-center px-0.5">
            <input
              ref={inputRef}
              id="tl-search"
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (query) onQueryChange("")
                  else e.currentTarget.blur()
                }
              }}
              onBlur={() => !query && onSearchOpenChange(false)}
              placeholder="Search"
              aria-label="Search employees"
              aria-keyshortcuts="/"
              className="tl-plain h-[14px] w-full min-w-0 bg-transparent font-sans text-sm max-md:h-5 max-md:text-base leading-none font-medium tracking-label text-(--tl-fg-ink) outline-none placeholder:text-(--tl-fg-placeholder) [&::-webkit-search-cancel-button]:hidden"
            />
          </span>
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
              className="flex size-5 shrink-0 items-center justify-center rounded-[4px] bg-(--tl-kbd) text-[#9b9b9b] transition-colors duration-(--duration-press) hover:text-(--tl-fg-ink) max-md:size-8"
            >
              <XIcon className="size-3" strokeWidth={2} />
            </button>
          ) : (
            <>
              <kbd className="relative size-5 shrink-0 overflow-hidden rounded-[4px] bg-(--tl-kbd) max-md:hidden" aria-hidden>
                <FigmaIcon src="/figma/icons/slash-divider.svg" className="absolute top-[3px] left-[3px]" />
              </kbd>
              <button
                type="button"
                aria-label="Close search"
                onClick={() => onSearchOpenChange(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-[4px] text-[#9b9b9b] md:hidden"
              >
                <XIcon className="size-4" strokeWidth={2} />
              </button>
            </>
          )}
        </label>
      </div>

      <div className={cn("flex shrink-0 items-center gap-2.5 max-md:gap-1", searchExpanded && "max-md:hidden")}>
        {/* Add — 1:9957 */}
        <DropdownMenu>
          <DropdownMenuTrigger className="tl-press flex h-[30px] max-md:h-10 max-md:px-3 items-center gap-[5px] overflow-hidden rounded-md border border-white bg-white p-[7px] shadow-(--tl-shadow-field) outline-none focus-visible:outline-2 focus-visible:outline-(--ring-focus)">
            <FigmaIcon src="/figma/icons/plus-header.svg" />
            <span className="tl-plain px-0.5 font-sans text-sm font-medium tracking-label whitespace-nowrap text-(--tl-fg-ink)">
              Add
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52" sideOffset={6}>
            <DropdownMenuItem onClick={onAddEmployee}>
              Employee
              <DropdownMenuShortcut>E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Shift template</DropdownMenuItem>
            <DropdownMenuItem>
              Department
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Import from CSV…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <VDivider className="max-md:hidden" />

        {/* Onboarding flag — 1:9963 */}
        <Popover open={onboardingOpen} onOpenChange={setOnboardingOpen}>
          <PopoverTrigger className="tl-press tl-press-ghost -mx-1 max-md:hidden flex items-center gap-0.5 rounded-md px-1 py-2 outline-none focus-visible:outline-2 focus-visible:outline-(--ring-focus)">
            <FigmaIcon src="/figma/icons/flag-01.svg" />
            <span className="tl-plain px-0.5 font-sans text-sm font-medium tracking-label whitespace-nowrap text-(--tl-fg-ink)">
              1/4
            </span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 gap-3 p-3" title="Getting started">
            <p className="text-sm font-medium text-(--tl-fg-strong)">Getting started · 1 of 4</p>
            <ol className="flex flex-col gap-2 text-[13px] tracking-[-0.01em] text-(--tl-fg-body)">
              {["Create your first timeline", "Invite your team", "Publish a schedule", "Resolve shift warnings"].map(
                (step, i) => (
                  <li key={step} className="flex items-center gap-2">
                    <span
                      className={
                        i === 0
                          ? "flex size-4 items-center justify-center rounded-full bg-(--tl-brand) text-[10px] font-semibold text-white"
                          : "flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-(--tl-fg-legend) shadow-(--tl-shadow-chip)"
                      }
                    >
                      {i + 1}
                    </span>
                    <span className={i === 0 ? "text-(--tl-fg-legend) line-through" : undefined}>{step}</span>
                  </li>
                )
              )}
            </ol>
          </PopoverContent>
        </Popover>

        <VDivider className="max-md:hidden" />

        <div className="flex items-center gap-2 max-md:hidden">
          <Tooltip>
            <TooltipTrigger
              className="tl-icon-btn size-3.5"
              aria-label="Inbox"
            >
              <FigmaIcon src="/figma/icons/inbox-01.svg" />
            </TooltipTrigger>
            <TooltipContent>Inbox</TooltipContent>
          </Tooltip>
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger className="tl-icon-btn size-3.5 outline-none" aria-label="Notifications">
              <FigmaIcon src="/figma/icons/bell-01.svg" />
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className="w-80 gap-1 p-1.5" title="Notifications">
              <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-(--tl-fg-legend)">Notifications</p>
              {NOTIFICATIONS.map((n) => (
                <div key={n.id} className="flex flex-col gap-1 rounded-md px-2 py-2 hover:bg-[#fafafa]">
                  <span className="text-[13px] leading-[1.3] font-medium tracking-[-0.01em] text-(--tl-fg-strong)">
                    {n.title}
                  </span>
                  <span className="text-xs text-(--tl-fg-legend)">{n.time}</span>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* < md: secondary actions collapse into one menu */}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="More" className={cn(PHONE_ICON_BTN, "-mr-2 md:hidden")}>
            <MoreHorizontalIcon className="size-5" strokeWidth={1.75} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" sideOffset={6}>
            <DropdownMenuItem onClick={() => setOnboardingOpen(true)}>
              <FigmaIcon src="/figma/icons/flag-01.svg" />
              Getting started
              <DropdownMenuShortcut>1/4</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setNotificationsOpen(true)}>
              <FigmaIcon src="/figma/icons/bell-01.svg" />
              Notifications
              <DropdownMenuShortcut>{NOTIFICATIONS.length}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FigmaIcon src="/figma/icons/inbox-01.svg" />
              Inbox
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenFeedback}>
              <FigmaIcon src="/figma/icons/chat.svg" />
              Send feedback
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
