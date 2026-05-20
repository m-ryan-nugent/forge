# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Forge is a personal fitness tracking web app (single-user). The repo is a monorepo with a Python backend and a React frontend.

## Dev Commands

**Backend** (from `backend/`):
```bash
uv run uvicorn app.main:app --reload   # starts on http://localhost:8000
```

**Frontend** (from `frontend/`):
```bash
npm run dev      # starts on http://localhost:5173
npm run build    # tsc + vite build
npm run lint     # eslint
```

API docs auto-generated at `http://localhost:8000/docs` when the backend is running.

No test suite is configured yet.

## Architecture

### Backend (`backend/`)

- **Framework**: FastAPI + SQLModel (SQLAlchemy + Pydantic) + SQLite
- **Package manager**: `uv` (see `pyproject.toml`)
- **Database**: SQLite file at `backend/forge.db`, created on startup via `SQLModel.metadata.create_all`
- **Entry point**: `app/main.py` — registers CORS (allows `localhost:5173`), mounts routers under `/api`, seeds exercise library on first run

Router/model layout:
```
app/
├── main.py          # FastAPI app, CORS, startup hook, router registration, exercise seed
├── database.py      # SQLite engine + get_session dependency
├── models/
│   ├── exercise.py  # Exercise table + MuscleGroup / Equipment / ExerciseCategory enums
│   └── workout.py   # WorkoutSession (+ Create/Update/Summary models), WorkoutExercise, SetEntry
└── routers/
    ├── exercises.py # CRUD + filter by muscle_group / equipment / category / search
    └── workouts.py  # CRUD for sessions; nested routes for exercises and sets; /stats endpoint
```

Workout data is nested three levels deep: `WorkoutSession → WorkoutExercise → SetEntry`. The router paths mirror this: `/workouts/{id}/exercises/{we_id}/sets/{set_id}`.

`secondary_muscle_groups` on `Exercise` is stored as a comma-separated string (not a relation).

`GET /api/workouts/` returns `WorkoutSessionSummary` (includes `exercise_count`). `GET /api/workouts/stats` returns weekly count, current streak, total completed, last workout, and muscle groups trained this week. The `/stats` route must stay registered before `/{workout_id}` to avoid routing collision.

**Important — SQLModel input models**: Never use a `table=True` SQLModel as a request body for POST/PUT endpoints. SQLModel table models bypass Pydantic's type coercions (e.g. `date`, `datetime`), causing SQLAlchemy to receive raw strings and fail on flush. Always use a separate non-table `SQLModel` (e.g. `WorkoutSessionCreate`, `WorkoutSessionUpdate`) as the request body type, then construct the table model from it.

### Frontend (`frontend/`)

- **Stack**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7
- **Tailwind v4** uses `@import "tailwindcss"` in CSS and the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`
- **API proxy**: Vite proxies all `/api` requests to `http://localhost:8000` (see `vite.config.ts`)

Source layout:
```
src/
├── api/
│   ├── client.ts        # typed fetch wrapper; all backend calls go through `api.*`
│   └── types.ts         # TypeScript interfaces mirroring backend SQLModel models
├── components/
│   ├── Layout.tsx        # Outlet wrapper; desktop sidebar + mobile bottom nav spacing
│   └── Navbar.tsx        # Responsive nav (sidebar on md+, bottom bar on mobile)
└── pages/
    ├── Dashboard.tsx     # Stats (streak, weekly count, muscle groups), recent workouts
    ├── WorkoutLogger.tsx # Create new workout form → navigates to WorkoutDetail
    ├── WorkoutDetail.tsx # Active workout logger: exercises, sets, complete/reopen
    ├── ExerciseLibrary.tsx
    ├── WorkoutHistory.tsx # Filterable (week/month/all), grouped by month, exercise count
    └── Progress.tsx
```

All backend calls go through `api` in `client.ts` — do not use raw `fetch` in components. Types in `types.ts` must stay in sync with the SQLModel models in `backend/app/models/`.

### Workout logging flow

1. `/workout` (WorkoutLogger) — user enters title/notes, submits → `POST /api/workouts/` → redirects to `/workout/:id`
2. `/workout/:id` (WorkoutDetail) — loads workout + exercises + sets; user adds exercises via modal, adds/edits sets inline (auto-save on blur), marks sets complete, clicks Complete Workout

## Design

- **Primary**: `#DC2626` (red), **Accent**: `#EF4444`
- **Success**: `#22C55E`, **Warning**: `#F59E0B`
- **Background**: `#F5F5F5` (light), `#1E1E1E` (dark surface)
- Mobile-first; responsive breakpoint is `md` (sidebar appears, bottom nav disappears)

## Build Phases

Phases 1–4 are complete. See `docs/FORGE_PRODUCT_SPEC.md` for the full product spec and remaining phases (Progress → Polish).

### Phase 4: Habit Tracker (complete)

`GET /api/habits/chart?weeks=N` (router: `app/routers/habits.py`) derives daily activity from `WorkoutSession` — no separate `HabitEntry` table needed. Intensity 0–4 is based on exercise count per workout (0=none, 1=1–2, 2=3–4, 3=5–6, 4=7+). Returns `[{date, workout_count, intensity, titles}]`.

`HabitChart` (`frontend/src/components/HabitChart.tsx`) renders an SVG GitHub-style 52×7 grid with month labels, Mon/Wed/Fri day labels, hover tooltips, and a legend. Displayed in Dashboard under a "Consistency" heading. The `habits.chart()` method lives in `api/client.ts`; `HabitDay` type is in `api/types.ts`.
