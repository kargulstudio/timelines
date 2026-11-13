"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NAV_FOOTER,
  NAV_MAIN,
  NAV_REPORTS,
  NAV_REPORTS_CHILDREN,
  NAV_TOP,
  NAV_WORK,
  WORKSPACES,
  type NavItem,
} from "@/lib/data"
import { comingSoon } from "@/lib/prototype"
import { FigmaIcon } from "./figma-icon"

type SidebarProps = {
  active: string
  onNavigate: (id: string) => void
  onCollapse: () => void
}

/** Figma 1:9815 — 240px rail on the #F5F5F5 shell. */
export function Sidebar({ active, onNavigate, onCollapse }: SidebarProps) {
  const [reportsOpen, setReportsOpen] = useState(true)
  const [workspace, setWorkspace] = useState<string>(WORKSPACES[0])
  const reportsChildActive = NAV_REPORTS_CHILDREN.some((c) => c.id === active)

  return (
    <aside aria-label="Sidebar" className="flex h-full w-60 shrink-0 flex-col px-3 pt-3 pb-3">
      {/* Workspace row — 1:9816 */}
      <div className="flex h-6 shrink-0 items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="tl-press tl-press-ghost -m-1 flex items-center gap-2 rounded-md p-1 outline-none focus-visible:outline-2 focus-visible:outline-(--ring-focus)"
            aria-label={`Workspace: ${workspace}`}
          >
            <span className="relative flex size-6 shrink-0 items-center justify-center rounded-[5px] bg-(--tl-brand) text-[12px] leading-none font-semibold tracking-[-0.24px] text-white">
              {workspace.charAt(0)}
            </span>
            <span className="flex items-center gap-0.5">
              <span className="text-[13px] leading-[14px] font-medium tracking-[-0.26px] whitespace-nowrap text-(--tl-fg-workspace)">
                {workspace}
              </span>
              <span className="relative size-2.5 shrink-0">
                <FigmaIcon src="/figma/icons/chevron-selector-vertical.svg" size={10} className="absolute top-px left-0" />
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" sideOffset={6}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              {WORKSPACES.map((ws) => (
                <DropdownMenuItem
                  key={ws}
                  onClick={() => {
                    setWorkspace(ws)
                    if (ws !== workspace) toast.success(`Switched to ${ws}`)
                  }}
                >
                  <span className="flex size-4 items-center justify-center rounded-[4px] bg-(--tl-brand) text-[10px] font-semibold text-white">
                    {ws.charAt(0)}
                  </span>
                  {ws}
                  {ws === workspace && <CheckIcon className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => comingSoon("Create workspace")}>
              Create workspace…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex w-[72px] items-center justify-end gap-2">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={<DropdownMenuTrigger className="tl-icon-btn size-3.5 outline-none" aria-label="More options" />}
              >
                <FigmaIcon src="/figma/icons/dots-horizontal.svg" />
              </TooltipTrigger>
              <TooltipContent>More</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48" sideOffset={8}>
              <DropdownMenuItem onClick={() => comingSoon("Workspace settings")}>
                Workspace settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("Keyboard shortcuts: / search, Esc clear")}>
                Keyboard shortcuts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => comingSoon("Sign out")}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger className="tl-icon-btn size-3.5" aria-label="Collapse sidebar" onClick={onCollapse}>
              <FigmaIcon src="/figma/icons/layout-left.svg" />
            </TooltipTrigger>
            <TooltipContent>Collapse sidebar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* New timeline — 1:9830 */}
      <button
        type="button"
        onClick={() => comingSoon("New timeline")}
        className="tl-press mt-4 flex h-[30px] w-full shrink-0 items-center justify-center gap-0.5 overflow-hidden rounded-lg bg-white pr-[11px] pl-2.5 shadow-(--tl-shadow-new)"
      >
        <span className="flex size-3.5 items-center justify-center">
          <FigmaIcon src="/figma/icons/plus-4.svg" size={15} />
        </span>
        <span className="text-sm font-medium whitespace-nowrap text-(--tl-fg-button)">New timeline</span>
      </button>

      {/* Navigation — 1:9836 */}
      <nav aria-label="Primary" className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {NAV_TOP.map((item) => (
            <NavRow key={item.id} item={item} active={active === item.id} onClick={() => onNavigate(item.id)} />
          ))}
        </div>
        <Rule />
        <div className="flex flex-col">
          {NAV_MAIN.map((item) => (
            <NavRow key={item.id} item={item} active={active === item.id} onClick={() => onNavigate(item.id)} />
          ))}
        </div>
        <Rule />
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <NavRow
              item={NAV_REPORTS}
              active={false}
              aria-expanded={reportsOpen}
              aria-controls="tl-reports-group"
              onClick={() => setReportsOpen((o) => !o)}
              trailing={
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className={cn(
                    "size-3 text-[#a2a2a2] opacity-0 transition-[opacity,rotate] duration-(--duration-fast) ease-out-strong group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100",
                    reportsOpen ? "rotate-0" : "-rotate-90",
                    !reportsOpen && reportsChildActive && "opacity-100"
                  )}
                >
                  <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <div id="tl-reports-group" className="tl-collapse" data-collapsed={!reportsOpen || undefined} inert={!reportsOpen}>
              <div className="flex flex-col">
                {NAV_REPORTS_CHILDREN.map((item) => (
                  <NavRow key={item.id} item={item} nested active={active === item.id} onClick={() => onNavigate(item.id)} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            {NAV_WORK.map((item) => (
              <NavRow key={item.id} item={item} active={active === item.id} onClick={() => onNavigate(item.id)} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer — 1:9927 */}
      <div className="mt-4 flex shrink-0 flex-col gap-4">
        <Rule />
        <div className="flex flex-col">
          {NAV_FOOTER.map((item) => (
            <NavRow key={item.id} item={item} active={active === item.id} onClick={() => onNavigate(item.id)} />
          ))}
        </div>
      </div>
    </aside>
  )
}

function Rule() {
  return <div aria-hidden className="h-px w-full shrink-0 bg-(--tl-rule)" />
}

type NavRowProps = {
  item: NavItem
  active: boolean
  nested?: boolean
  onClick: () => void
  trailing?: React.ReactNode
} & Pick<React.ComponentProps<"button">, "aria-expanded" | "aria-controls">

function NavRow({ item, active, nested, onClick, trailing, ...aria }: NavRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      {...aria}
      className={cn(
        "group/nav tl-press tl-press-ghost flex h-[30px] w-full shrink-0 items-center gap-1 overflow-hidden rounded-[7px] py-2 pr-2 text-left outline-none",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ring-focus)",
        nested ? "pl-8" : "pl-2",
        active && "bg-(--tl-nav-active)! "
      )}
    >
      <FigmaIcon src={item.icon} />
      <span className="flex min-w-0 flex-1 items-center px-0.5">
        <span className="tl-plain min-w-0 flex-1 truncate font-sans text-sm font-medium tracking-label text-(--tl-fg-nav)">
          {item.label}
        </span>
      </span>
      {trailing}
    </button>
  )
}
