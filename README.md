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
- **Warnings**: the Conflicts and Overtime chips highlight the affected shifts, and *Fix warnings* resolves them, with Undo
- **Shift bars**: hover for a tooltip; click for details, Resolve or Remove
- **Cards**: collapse, show or hide connectors, sort, and add an employee
- **Publish schedule** warns while issues remain, then publishes

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
| [`components/shift-bar.tsx`](components/shift-bar.tsx) | Shift bar with tooltip and details popover |
| [`components/figma-icon.tsx`](components/figma-icon.tsx) | Local Figma icon helper |
| [`lib/data.ts`](lib/data.ts) | Mock departments, employees, shifts, connectors and warnings |
