export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'core' | 'quads' | 'hamstrings' | 'glutes'
  | 'calves' | 'full_body' | 'cardio'

export type Equipment =
  | 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'cable'
  | 'bodyweight' | 'resistance_band' | 'cardio_machine' | 'other'

export type ExerciseCategory = 'strength' | 'cardio' | 'mobility' | 'core'

export interface Exercise {
  id: number
  name: string
  primary_muscle_group: MuscleGroup
  secondary_muscle_groups: string | null
  equipment: Equipment
  category: ExerciseCategory
  instructions: string | null
}

export interface WorkoutSession {
  id: number
  title: string
  date: string
  duration_minutes: number | null
  notes: string | null
  completed: boolean
  created_at: string
  exercise_count?: number
}

export interface WorkoutStats {
  total_completed: number
  total_all: number
  weekly_count: number
  current_streak: number
  last_workout: { id: number; title: string; date: string } | null
  muscle_groups_this_week: string[]
}

export interface WorkoutExercise {
  id: number
  workout_session_id: number
  exercise_id: number
  order: number
  notes: string | null
}

export interface HabitDay {
  date: string
  workout_count: number
  intensity: 0 | 1 | 2 | 3 | 4
  titles: string[]
}

export interface SetEntry {
  id: number
  workout_exercise_id: number
  set_number: number
  reps: number | null
  weight: number | null
  duration_seconds: number | null
  distance: number | null
  completed: boolean
}
