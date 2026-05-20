## Purpose
Build a desktop and mobile-friendly web application that helps me:
- Track workouts, exercises, sets, reps, weight, cardio, and body progress
- Encourage consistency through habit tracking, streaks, progress visuals, and simple gamification
Core idea: "Forge helps you build strength, consistency, and discipline one workout at a time."
## Primary Goals
The app should help me:
- Log workouts quickly
- Track strength progress over time
- Maintain a consistent workout schedule
- View workout history
- Track habits and streaks
- See which muscle groups I am training
- Stay motivated through simple gamification
- Use the app easily on both desktop and phone
## MVP Features
### 01. Workout Logging
I, as a user, should be able to:
- Create a workout session
- Add exercises to the session
- Log sets, reps, and weight
- Log cardio duration, distance, or calories
- Add notes to a workout
- Mark a workout as complete
- View workout history
### 02. Exercise Library
Each exercise should include:
- Exercise name
- Muscle group
- Equipment type
- Exercise category:
	- Strength
	- Cardio
	- Mobility
	- Core
- Optional instructions
#### Example
```text
Bench Press
Primary muscle: Chest
Secondary muscles: Triceps, Shoulders
Equipment: Barbell
Category: Strength
```
### 03. Habit Tracker
Include a GitHub-style consistency chart showing:
- Days worked out
- Intensity or workout duration
- Streaks
- Missed days
- Weekly consistency
### 04. Progress Tracking
Track:
- Weight lifted over time
- Personal records
- Workout frequency
- Volume per muscle group
- Body weight
- Optional progress photos later
### 05. Dashboard
The dashboard should show:
- Habit chart
- Current weekly workout count
- Current streak
- Last workout
- Next planned workout
- Recent progress
- Muscle groups trained this week
## Nice-to-Have Features
Add these after the MVP:
- Workout templates
- Program builder
- Body muscle map
- Rest timer
- Exercise substitutions
- Progress photos
- Goals
- Badges
- Weekly summaries
- Mobile install support as a PWA
- Export to CSV
- AI-generated workout suggestions later
## Suggested Tech Stack
### Backend
- Python
- FastAPI
- SQLite for local/simple development
- PostgreSQL later when deployed
- SQLAlchemy or SQLModel
- Pydantic for validation
### Frontend
Simple but modern:
- React
- TypeScript
- Tailwind CSS
- Vite
### Deployment Options
For later:
- Raspberry Pi K3s cluster
- Docker Compose
- Render/Fly.io/Railway
- Self-hosted with Tailscale
## Core Data Model
### User
For personal use, this can be simple.
```text
User
- id
- name
- email
- created_at
```
### WorkoutSession
```text
WorkoutSession
- id
- user_id
- title
- date
- duration_minutes
- notes
- completed
- created_at
```
### Exercise
```text
Exercise
- id
- name
- primary_muscle_group
- secondary_muscle_groups
- equipment
- category
- instructions
```
### WorkoutExercise
Links an exercise to a workout.
```text
WorkoutExercise
- id
- workout_session_id
- exercise_id
- order
- notes
```
### SetEntry
```text
SetEntry
- id
- workout_exercise_id
- set_number
- reps
- weight
- duration_seconds
- distance
- completed
```
### HabitEntry
```text
HabitEntry
- id
- date
- workout_completed
- intensity
- notes
```
### BodyMetric
```text
BodyMetric
- id
- date
- body_weight
- body_fat_percentage
- notes
```
## Main Screens
### 01. Dashboard
Purpose: quick overview.
Includes:
- Habit tracker chart
- Today's planned workout
- Start workout button
- Weekly progress
- Current streak
- Recent workouts
- Muscle group summary
### 02. Workout Logger
Purpose: log a workout quickly.
Includes:
- Workout title
- Add exercise button
- Exercise cards
- Set rows
- Add set button
- Complete workout button
Example set row:
```text
Set 1 | 135 lbs | 10 reps | Complete
```
### 03. Exercise Library
Purpose: manage available exercises.
Includes:
- Search
- Filter by muscle group
- Filter by equipment
- Add custom exercise
### 04. Workout History
Purpose: view past workouts.
Includes:
- Calendar/list view
- Workout details
- Filters by date, muscle group, exercise
### 05. Progress
Purpose: visualize improvement.
Includes:
- Strength charts
- Volume charts
- Body weight chart
- PR list
- Workout frequency
### 06. Body Map
Purpose: show trained muscle groups.
Includes:
- Human body diagram
- Highlight recently trained muscles
- Muscle group breakdown
### 07. Settings
Includes:
- App theme
- Units: lbs/kg
- Weekly workout goal
- Data export
- Reset data
## MVP Build Phase
### Phase 1: Foundation
Build:
- Project setup
- Database
- API structure
- Basic responsive layout
- Navigation
- Exercise model
- Workout model
Goal: You can create workouts and exercises.
### Phase 2: Workout Logging
Build:
- Create workout
- Add exercises
- Add sets
- Mark sets complete
- Complete workout
- View workout detail
Goal: You can fully log a workout.
### Phase 3: History and Dashboard
Build:
- Workout history page
- Dashboard summary
- Weekly workout count
- Recent workouts
- Current streak
Goal: You can see your activity over time.
### Phase 4: Habit Tracker
Build:
- GitHub-style chart
- Daily completion records
- Weekly goal tracking
- Streak logic
Goal: You can track consistency visually.
### Phase 5: Progress Tracking
Build:
- Exercise progress charts
- Personal records
- Volume by muscle group
- Body weight tracking
Goal: You can see strength and body progress.
### Phase 6: Polish
Build:
- Mobile-first improvements
- Dark/light mode
- Better empty states
- Loading states
- Error handling
- Seed exercise library
- PWA support
Goal: The app feels usable and polished.
## Gamification Ideas
Keep this simple at first.
### Streaks
Examples:
- 3-day streak
- 7-day streak
- 30-day streak
### Badges
Examples:
- First workout
- 10 workouts completed
- Leg Day Warrior
- Consistency King
- 100 Total Sets
- New PR
### Levels
Level based on completed workouts:
```text
Level 1: Beginner
Level 2: Consistent
Level 3: Forged
Level 4: Iron Discipline
```
### Weekly Score
Calculate a weekly score from:
- Workouts completed
- Total sets
- Cardio minutes
- Habit streak
- PRs achieved
## Design Direction
Recommended style:
- Clean
- Minimal
- Strong
- Light mode first
- Mobile-friendly
- Fitness dashboard feel
- Not too "gym bro"
Suggested colors:
```text
Primary Red:    #DC2626
Accent Red:     #EF4444
Dark Surface:   #1E1E1E
Neutral Light:  #F5F5F5
Success Green:  #22C55E
Warning Amber:  #F59E0B
```