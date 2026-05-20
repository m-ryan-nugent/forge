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
├── main.py           # FastAPI app, CORS, startup hook, router registration, exercise seed
├── database.py       # SQLite engine + get_session dependency
├── models/
│   ├── exercise.py   # Exercise table + MuscleGroup / Equipment / ExerciseCategory enums
│   ├── workout.py    # WorkoutSession (+ Create/Update/Summary models), WorkoutExercise, SetEntry
│   └── body_metric.py # BodyMetric table + BodyMetricCreate input model
└── routers/
    ├── exercises.py  # CRUD + filter by muscle_group / equipment / category / search
    ├── workouts.py   # CRUD for sessions; nested routes for exercises and sets; /stats endpoint
    ├── habits.py     # GET /habits/chart — derives activity from WorkoutSession
    ├── progress.py   # GET /progress/exercise/{id}, /records, /volume, /frequency
    └── body_metrics.py # GET/POST /body-metrics/, DELETE /body-metrics/{id}
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
│   ├── Navbar.tsx        # Responsive nav (sidebar on md+, bottom bar on mobile)
│   └── HabitChart.tsx    # SVG GitHub-style 52×7 consistency grid, used on Dashboard
└── pages/
    ├── Dashboard.tsx     # Stats (streak, weekly count, muscle groups), recent workouts
    ├── WorkoutLogger.tsx # Create new workout form → navigates to WorkoutDetail
    ├── WorkoutDetail.tsx # Active workout logger: exercises, sets, complete/reopen
    ├── ExerciseLibrary.tsx
    ├── WorkoutHistory.tsx # Filterable (week/month/all), grouped by month, exercise count
    └── Progress.tsx      # Tabbed: Records | Strength | Volume | Body (see Phase 5)
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

Phases 1–5 are complete. See `docs/FORGE_PRODUCT_SPEC.md` for the full product spec and remaining phase (Polish).

### Phase 4: Habit Tracker (complete)

`GET /api/habits/chart?weeks=N` (router: `app/routers/habits.py`) derives daily activity from `WorkoutSession` — no separate `HabitEntry` table needed. Intensity 0–4 is based on exercise count per workout (0=none, 1=1–2, 2=3–4, 3=5–6, 4=7+). Returns `[{date, workout_count, intensity, titles}]`.

`HabitChart` (`frontend/src/components/HabitChart.tsx`) renders an SVG GitHub-style 52×7 grid with month labels, Mon/Wed/Fri day labels, hover tooltips, and a legend. Displayed in Dashboard under a "Consistency" heading. The `habits.chart()` method lives in `api/client.ts`; `HabitDay` type is in `api/types.ts`.

### Phase 5: Progress Tracking (complete)

**Backend — `app/routers/progress.py`** (prefix `/api/progress`):
- `GET /exercise/{exercise_id}?months=N` — per-session `{date, max_weight, total_volume, set_count}` for one exercise in completed workouts. Filters to completed sets with weight.
- `GET /records` — all-time best set per exercise: `{exercise_id, exercise_name, muscle_group, max_weight, reps_at_max, date}`. Sorted by muscle group.
- `GET /volume?weeks=N` — weekly volume (weight × reps) grouped by `{week_start, muscle_group, total_volume}`. Default 12 weeks.
- `GET /frequency?months=N` — completed workout count per week: `{week_start, count}`. Default 6 months.

**Backend — `app/routers/body_metrics.py`** (prefix `/api/body-metrics`):
- `GET /` — all entries ordered by date desc.
- `POST /` — create entry (`BodyMetricCreate`: date, body_weight, body_fat_percentage, notes).
- `DELETE /{id}` — delete entry.
- `BodyMetric` table is in `app/models/body_metric.py`; imported in `main.py` so `create_all` picks it up.

**Frontend — `Progress.tsx`** has four tabs, each a separate card layout:
- **Records** — sortable table of PRs pulled from `/progress/records`.
- **Strength** — exercise dropdown (only exercises with PR data) + time-range buttons (1M/3M/6M/12M) + `LineChart` SVG of max weight per session + summary stats row.
- **Volume** — `VolumeChart` (horizontal div-based bars, total weight×reps per muscle group over 12 weeks) + `FrequencyChart` (SVG vertical bar chart of workouts/week over 6 months).
- **Body** — date/weight/body-fat log form + `LineChart` SVG of body weight over time (blue, `#2563EB`) + log table with delete.

All three chart helpers (`LineChart`, `FrequencyChart`, `VolumeChart`) are defined inline in `Progress.tsx`. `LineChart` is reused for both strength and body weight with a `color` prop.
