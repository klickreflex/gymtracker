# GymTracker

Personal PWA for tracking strength training sessions at the gym.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- Dexie.js (IndexedDB)
- React Router
- Recharts (Phase 3)
- vite-plugin-pwa

## Docs

- Product spec: `docs/PRD.md`
- Visual reference: `demo/trainingsplan-static.html`

## Conventions

- UI language: German (all user-facing text)
- Code language: English (variables, comments, commits)
- Mobile-first, dark theme, max-width 480px
- Functional components with hooks, no class components
- No state management library — React Context + useReducer
- No UI component library — custom components with Tailwind
- Each DB write is immediate (no batching) — sessions must survive screen-off

## Commands

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```

## Structure

```
src/
  components/   # Reusable UI components
  views/        # Route-level views (PlanView, SessionView, HistoryView, SettingsView)
  db/           # Dexie schema, seed data, queries
  hooks/        # Custom React hooks
  types/        # TypeScript interfaces
  utils/        # Helpers
```
