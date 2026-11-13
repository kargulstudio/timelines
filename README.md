# Timelines

> [!IMPORTANT]
> **Design prototype only.** No backend, no API and no auth. Everything is mock data in `lib/`, and nothing you do is saved.

Acme Inc.'s weekly shift scheduler: department cards with an employee column and a Mon–Sun grid of shift bars, days off, sick days and shift-swap connectors.

Built from Figma file `ZKxOvLKOz4VYG21iEqjG4l`, node `1-9814` ([open in Figma](https://www.figma.com/design/ZKxOvLKOz4VYG21iEqjG4l/Untitled?node-id=1-9814)).

## Run it

```bash
pnpm install
```

```bash
pnpm dev
```

Open <http://localhost:3000>. The design is authored at **1440 × 1024**, so that viewport matches Figma 1:1.

Other scripts: `pnpm build` · `pnpm start` · `pnpm lint`

## What works

- **Search** (<kbd>/</kbd>) filters employees across departments
- **Location / department** filters and a **week picker**
- **Warnings**: the Conflicts and Overtime chips highlight the affected shifts, and *Fix warnings* resolves them, with Undo. Edited shifts are re-checked against days off, sick days and each person's weekly hour limit
- **Shift bars**: hover for a tooltip; click for details, Edit, Resolve or Remove; double-click to edit
- **Shift editor**: title, start / end time and day range, plus Delete. <kbd>Enter</kbd> saves, <kbd>Esc</kbd> cancels
- **Add a shift**: click an empty day in an employee's row (a ghost bar shows on hover)
- **Days off / sick days**: an empty day's corner menu (or the new-shift editor) marks it OFF or Sick; click an OFF / Sick cell to switch or clear it
- **Drag**: move a bar to other days or pull its edges to resize, snapping to day columns and stopping at other shifts, days off and sick days. On touch, press and hold first. With a bar focused, <kbd>←</kbd> / <kbd>→</kbd> move it, <kbd>Shift</kbd> + arrows resize it, <kbd>Delete</kbd> removes it
- **Weekly hours** pills follow the shifts (Figma's numbers for the untouched schedule, then every edit adds or removes its own hours)
- **Swap / cover links** keep their exact Figma vectors until a linked shift moves; then they are redrawn between the bars' current positions, and dropped if a shift is deleted
- **Undo** in the toast for removals, edits, moves, day changes, renames and removed employees
- **Cards**: collapse, show or hide links, sort, add an employee, rename the department inline (pencil, or double-click the title) and remove an employee from the row menu
- **Publish schedule** warns while issues remain, then publishes
- **Mobile**: below 1024px the sidebar is a drawer and the week scrolls sideways (snapping per day) under a sticky employee column; on phones search collapses to an icon, filters sit behind one *Filters* button, secondary actions move into a "…" menu, and popovers and editors open as bottom sheets
- Anything not built yet (other pages, workspace settings, imports, shift templates…) says it is coming soon

## Stack

- **Next.js 16** (App Router, React 19)
- **Tailwind CSS v4** with design tokens in `app/globals.css` (adapted from Statsnap) plus app tokens in `app/timelines.css`
- **shadcn/ui on Base UI** primitives in `components/ui`
- **lucide-react** icons; every Figma icon, logo and image is a local file in `public/figma/`

## Project layout

| Path | What it is |
| --- | --- |
| [`components/timelines-app.tsx`](components/timelines-app.tsx) | App shell, filters, warnings and schedule state |
| [`components/sidebar.tsx`](components/sidebar.tsx) | Workspace switcher and navigation |
| [`components/top-bar.tsx`](components/top-bar.tsx) | Search, Add, onboarding and notifications |
| [`components/schedule-toolbar.tsx`](components/schedule-toolbar.tsx) | Week picker, warnings, Publish and filters |
| [`components/department-card.tsx`](components/department-card.tsx) | Department card with header actions and legend |
| [`components/schedule-grid.tsx`](components/schedule-grid.tsx) | Employee rows and the 7-day CSS grid |
| [`components/shift-bar.tsx`](components/shift-bar.tsx) | Shift bar with tooltip, details popover, drag and keyboard moves |
| [`components/shift-editor.tsx`](components/shift-editor.tsx) | Add / edit shift form |
| [`components/ui/responsive-popover.tsx`](components/ui/responsive-popover.tsx) | Popover that becomes a bottom sheet on phones |
| [`components/figma-icon.tsx`](components/figma-icon.tsx) | Local Figma icon helper |
| [`lib/data.ts`](lib/data.ts) | Mock departments, employees, shifts, connectors and warnings |
| [`lib/schedule.ts`](lib/schedule.ts) | Time parsing, placement rules, weekly hours and warning checks |
| [`lib/prototype.ts`](lib/prototype.ts) | `comingSoon()` toast for unbuilt features |
| [`app/icon.svg`](app/icon.svg), [`app/apple-icon.tsx`](app/apple-icon.tsx) | Favicon and Apple touch icon from the Acme mark (`public/figma/logo.svg`) |
