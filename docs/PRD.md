# GymTracker — Product Requirements Document

**Version:** 1.0  
**Date:** March 20, 2026  
**Author:** Daniel Wentsch  
**Purpose:** PRD for development with Claude Code

---

## 1. Overview

GymTracker is a personal Progressive Web App (PWA) for tracking strength training sessions at the gym. It replaces a printed training plan with an interactive, mobile-optimized tool that tracks sessions, visualizes progress, and makes the training plan manageable.

**User:** Single user (the developer himself). No multi-user, no auth, no backend.

**Primary device:** iPhone (Safari), secondary desktop browser for data review.

**Core principle:** In the gym, you want to tap, not type. The app must be operable with taps — large touch targets, minimal text input, pre-filled values.

---

## 2. Tech Stack

| Component | Technology | Rationale |
|---|---|---|
| Framework | React (Vite) | Best Claude Code support, component-based |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Persistence | IndexedDB via Dexie.js | Structured data, async, sync-ready |
| Routing | React Router | For Plan/Session/History/Settings views |
| PWA | vite-plugin-pwa | Service worker, manifest, offline |
| Deployment | Static files (Netlify/Vercel/own server) | Simplest setup |

No additional dependencies beyond these. No state management library (React Context + useReducer are sufficient). No UI library — custom components with Tailwind.

---

## 3. Information Architecture

The app has four main sections, accessible via bottom navigation:

```
┌─────────────────────────────────┐
│  1. Plan      (Default view)    │  View training plan, start session
│  2. History   (Calendar)        │  Review past sessions
│  3. Progress  (Charts)          │  Weight progression per exercise
│  4. Settings  (Management)      │  Edit plan, import/export
└─────────────────────────────────┘
```

Phase 1 implements **Plan** and **Settings** (import/export only).  
Phase 2 extends **Settings** with plan management.  
Phase 3 implements **History** and **Progress**.

---

## 4. Data Model (Dexie.js / IndexedDB)

### 4.1 Tables

```typescript
// db.ts
import Dexie, { type Table } from 'dexie';

interface Exercise {
  id: string;           // UUID
  name: string;         // e.g. "Klimmzug"
  muscleGroups: string[]; // e.g. ["Rücken", "Bizeps"]
  deviceNumber: number; // Machine number in the gym
  order: number;        // Position in the plan
  optional: boolean;    // true for optional exercises
  defaultSets: number;  // Target sets (e.g. 3)
  defaultReps: number;  // Target reps (e.g. 15)
  defaultWeight: number | null; // Target weight in kg, null for bodyweight
  weightUnit: 'kg' | 'bw'; // 'bw' for bodyweight exercises
  settings: ExerciseSetting[]; // Machine settings
  notes: string;        // Free-text notes (e.g. "assistiert, Gegengewicht")
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}

interface ExerciseSetting {
  label: string;        // e.g. "Sitz", "Position", "Höhe", "Griff"
  value: string;        // e.g. "3", "↓"
}

interface Session {
  id: string;           // UUID
  startedAt: string;    // ISO timestamp
  completedAt: string | null; // ISO timestamp, null if aborted
  sets: SessionSet[];   // All sets in this session
}

interface SessionSet {
  id: string;           // UUID
  exerciseId: string;   // FK to Exercise
  setNumber: number;    // 1, 2, 3...
  plannedReps: number;  // Target reps
  plannedWeight: number | null;
  actualReps: number | null;   // Actual reps (null = as planned)
  actualWeight: number | null; // Actual weight (null = as planned)
  completedAt: string;  // ISO timestamp
  skipped: boolean;     // true if exercise was skipped
}
```

### 4.2 Seed Data (current training plan)

On first app launch, the following plan is loaded. Note: all exercise names, muscle group labels, and setting labels are in German — this is the actual UI language.

```json
[
  {
    "name": "Klimmzug",
    "muscleGroups": ["Rücken", "Bizeps"],
    "deviceNumber": 17,
    "order": 1,
    "optional": false,
    "defaultSets": 3,
    "defaultReps": 15,
    "defaultWeight": 42,
    "weightUnit": "kg",
    "settings": [],
    "notes": "Assistiert — 42 kg Gegengewicht"
  },
  {
    "name": "Beinpresse",
    "muscleGroups": ["Beine", "Gesäß"],
    "deviceNumber": 1,
    "order": 2,
    "optional": false,
    "defaultSets": 3,
    "defaultReps": 15,
    "defaultWeight": 90,
    "weightUnit": "kg",
    "settings": [{ "label": "Sitz", "value": "3" }],
    "notes": ""
  },
  {
    "name": "Rudern am Kabel",
    "muscleGroups": ["Rücken"],
    "deviceNumber": 16,
    "order": 3,
    "optional": false,
    "defaultSets": 3,
    "defaultReps": 15,
    "defaultWeight": 35,
    "weightUnit": "kg",
    "settings": [],
    "notes": ""
  },
  {
    "name": "Butterfly",
    "muscleGroups": ["Brust"],
    "deviceNumber": 11,
    "order": 4,
    "optional": false,
    "defaultSets": 3,
    "defaultReps": 15,
    "defaultWeight": 10,
    "weightUnit": "kg",
    "settings": [
      { "label": "Position", "value": "2" },
      { "label": "Sitz", "value": "3" },
      { "label": "Stift", "value": "2,5" }
    ],
    "notes": ""
  },
  {
    "name": "Armdrücken am Kabel",
    "muscleGroups": ["Trizeps"],
    "deviceNumber": 18,
    "order": 5,
    "optional": true,
    "defaultSets": 3,
    "defaultReps": 15,
    "defaultWeight": 15,
    "weightUnit": "kg",
    "settings": [
      { "label": "Höhe", "value": "36" },
      { "label": "Griff", "value": "↓" }
    ],
    "notes": ""
  },
  {
    "name": "Armbeugen am Kabel",
    "muscleGroups": ["Bizeps"],
    "deviceNumber": 18,
    "order": 6,
    "optional": true,
    "defaultSets": 3,
    "defaultReps": 15,
    "defaultWeight": 12.5,
    "weightUnit": "kg",
    "settings": [
      { "label": "Höhe", "value": "1" },
      { "label": "Griff", "value": "↑" }
    ],
    "notes": ""
  },
  {
    "name": "Hyperextension",
    "muscleGroups": ["Unterer Rücken"],
    "deviceNumber": 14,
    "order": 7,
    "optional": false,
    "defaultSets": 3,
    "defaultReps": 15,
    "defaultWeight": null,
    "weightUnit": "bw",
    "settings": [{ "label": "Position", "value": "3" }],
    "notes": ""
  },
  {
    "name": "Rumpfrotation",
    "muscleGroups": ["Seitl. Bauch"],
    "deviceNumber": 2,
    "order": 8,
    "optional": false,
    "defaultSets": 3,
    "defaultReps": 15,
    "defaultWeight": 10,
    "weightUnit": "kg",
    "settings": [{ "label": "Position", "value": "3" }],
    "notes": ""
  }
]
```

---

## 5. Phase 1 — Interactive Training

### 5.1 Plan View (Default)

The plan view shows all exercises as cards in the defined order. Each card displays:

- Exercise number (sequential)
- Exercise name
- Muscle groups as small badges below the name
- Sets, reps, weight, and machine number as stat cards in a row
- Machine settings (seat, position, etc.) as small tags
- Optional exercises: diagonal "Optional" ribbon in the upper-right corner (amber accent color)
- Notes if present

At the bottom of the list: a prominent **"Training starten"** button.

**Design reference:** The file `demo/trainingsplan-static.html` in the project folder is the visual template for the card layout, color palette, typography, and exercise card design. Use it as the target aesthetic for React component development — not a 1:1 port, but the goal to match.

### 5.2 Session Mode

#### Entry
- Tap on "Training starten" → a new Session record is created in the DB (startedAt = now)
- The UI switches to session mode
- A session bar appears at the top: running duration (timer), progress indicator (e.g. "3/8 Übungen"), cancel button

#### Exercise Cards in Session Mode
Each exercise card now shows, in addition to the plan info:

**Set tracker:** A row of circles/buttons for each set (e.g. ○ ○ ○ for 3 sets). Tap the next open circle → set marked as completed (●). Visual feedback: animation, color change, optional haptic feedback (Haptic Feedback API if available).

**Quick confirm:** A single tap on the set circle logs the set with the planned values (planned reps and weight). This is the happy path — no further input needed.

**Edit deviation:** Long tap or small edit button next to the set opens a compact inline form:
- Weight: +/- stepper (in 2.5 kg increments) and free-text field
- Reps: +/- stepper
- The current plan value is pre-filled

**Skip exercise:** Each card has a subtle "Überspringen" link. Skips the entire exercise (e.g. when the machine is occupied). Logged in the session record.

**Order:** Exercises are displayed in plan order, but the user can log sets in any order. There is no forced sequential flow. Cards scroll vertically; fully completed exercises are visually marked as done (e.g. green checkmark, slightly dimmed) and optionally collapse or move to the bottom.

#### Rest Timer (nice-to-have Phase 1)
After each logged set, an optional 30-second countdown starts (configurable). Subtle, visible but not modal, not blocking.

#### Ending a Session
- When all required exercises are completed, a "Training beenden" button appears
- Optional exercises do not need to be completed
- The user can manually end the session at any time (including early)
- On end: session is saved (completedAt = now)

#### Session Summary
After ending the session, a brief summary view:
- Session duration
- Number of completed exercises / sets
- Deviations from plan (if any)
- Skipped exercises (if any)
- Button: "Zurück zum Plan"

### 5.3 Persistence During Use

The app must handle the iPhone display turning off and on during training. A running session must not be lost. Dexie.js writes each set to the DB immediately upon logging — no in-memory-only state that could be lost.

---

## 6. Phase 2 — Plan Management

### 6.1 Edit Exercise
Via settings or an edit button on each card in the plan view:
- Name, muscle groups, machine number
- Target sets, target reps, target weight
- Machine settings (key-value pairs, dynamically addable)
- Optional flag
- Notes

### 6.2 Add Exercise
Form with the same fields as "Edit". New exercise is appended at the end of the list.

### 6.3 Remove Exercise
Soft delete with confirmation. Historical session data is preserved.

### 6.4 Reorder Exercises
Drag-and-drop or move-up/move-down buttons to reorder.

---

## 7. Phase 3 — History & Progress

### 7.1 History View (Calendar)
- Month calendar, days with sessions are marked
- Tap on a day → session detail: which exercises, which weights, which deviations
- Scrollable list of past sessions as an alternative to the calendar

### 7.2 Progress View (Charts)
- Dropdown: select exercise
- Line chart: weight progression over time for this exercise
- Secondary chart: training volume per week (sets × reps × weight)
- Chart library: Recharts (React-compatible, well-established)

---

## 8. Import/Export (Phase 1 — Must Have)

### 8.1 Export
- Button in Settings: "Daten exportieren"
- Exports the entire DB as a single JSON file
- Filename: `gymtracker-backup-YYYY-MM-DD.json`
- Download via native browser download dialog

### 8.2 Import
- Button in Settings: "Daten importieren"
- Accepts a previously exported JSON file
- Confirmation dialog: "Import überschreibt alle vorhandenen Daten. Fortfahren?"
- Validation: file must match the expected structure, otherwise error message

### 8.3 JSON Structure

```json
{
  "version": 1,
  "exportedAt": "2026-03-20T12:00:00Z",
  "exercises": [ ... ],
  "sessions": [ ... ]
}
```

---

## 9. PWA Requirements

### 9.1 Manifest
```json
{
  "name": "GymTracker",
  "short_name": "GymTracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f1115",
  "theme_color": "#0f1115",
  "icons": [ ... ]
}
```

### 9.2 Service Worker
- Caching strategy: cache-first for app shell (HTML, CSS, JS, fonts)
- No API caching needed (no backend)
- vite-plugin-pwa generates the service worker automatically

### 9.3 Offline Capability
The app must work fully offline. All data is local. There are no external API calls.

---

## 10. Design Guidelines

### 10.1 Visual Concept
- **Dark theme** as default (gym environment, OLED-friendly)
- **Color palette:** Background #0f1115, cards #1a1d24, accent #4ecdc4 (teal), optional ribbon #f59e0b (amber)
- **Typography:** System font for body, monospace for numbers/stats
- **Touch targets:** Minimum 44×44px, preferably 48×48px (Apple HIG)
- **No hover states** as primary interaction — everything must work via tap

### 10.2 Mobile-First
- Max-width: 480px container, centered
- No hamburger menu — bottom navigation with 3-4 tabs
- Card-based layout, vertical scroll
- Large, clear numbers for weights and reps (must be readable at a glance in the gym)

### 10.3 Session Mode Visuals
- Clear visual distinction between plan view and session mode (e.g. different top bar color, visible timer)
- Completed sets: filled circles in accent color
- Completed exercises: green checkmark, slightly reduced opacity
- Skipped exercises: strikethrough, strongly dimmed

### 10.4 UI Language
The entire user-facing UI is in **German**. All button labels, headings, status messages, and form labels must be in German. Code (variable names, comments) remains in English.

---

## 11. Implementation Order (for Claude Code)

### Sprint 1: Foundation
1. Vite + React + Tailwind + React Router setup
2. Dexie.js DB with schema + seed data
3. Plan view with static card layout (port the design from `demo/trainingsplan-static.html` into React components)
4. Bottom navigation shell (Plan, Settings placeholder)

### Sprint 2: Session Mode
1. "Training starten" → create session
2. Set tracker UI (circles, tap to complete)
3. Deviation editing (inline form)
4. Skip exercise
5. End session + summary
6. Immediate persistence of each set to IndexedDB

### Sprint 3: Import/Export + PWA
1. JSON export function
2. JSON import with validation
3. PWA manifest + service worker via vite-plugin-pwa
4. Offline test

### Sprint 4: Plan Management (Phase 2)
1. Edit exercise (form)
2. Add exercise
3. Delete exercise (soft delete)
4. Reorder exercises

### Sprint 5: History & Progress (Phase 3)
1. Session history list
2. Calendar view
3. Session detail view
4. Weight progression chart (Recharts)
5. Volume per week chart

---

## 12. Out of Scope

- Multi-user / authentication
- Backend / cloud sync (prepared via IndexedDB + timestamps, but no server)
- Native app (iOS/Android)
- Exercise instructions / videos / images
- Automatic training plan generation
- Integration with wearables or fitness APIs
- Light theme (can be added later, not a priority)
