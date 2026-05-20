import type { WorkoutSession, WorkoutStats, HabitDay } from './types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  exercises: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request(`/exercises/${qs}`)
    },
    get: (id: number) => request(`/exercises/${id}`),
    create: (body: unknown) => request('/exercises/', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: unknown) => request(`/exercises/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: number) => request(`/exercises/${id}`, { method: 'DELETE' }),
  },
  workouts: {
    list: () => request<WorkoutSession[]>('/workouts/'),
    stats: () => request<WorkoutStats>('/workouts/stats'),
    get: (id: number) => request(`/workouts/${id}`),
    create: (body: unknown) => request('/workouts/', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: unknown) => request(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: number) => request(`/workouts/${id}`, { method: 'DELETE' }),
    exercises: {
      list: (workoutId: number) => request(`/workouts/${workoutId}/exercises`),
      add: (workoutId: number, body: unknown) =>
        request(`/workouts/${workoutId}/exercises`, { method: 'POST', body: JSON.stringify(body) }),
      remove: (workoutId: number, weId: number) =>
        request(`/workouts/${workoutId}/exercises/${weId}`, { method: 'DELETE' }),
    },
    sets: {
      list: (workoutId: number, weId: number) =>
        request(`/workouts/${workoutId}/exercises/${weId}/sets`),
      add: (workoutId: number, weId: number, body: unknown) =>
        request(`/workouts/${workoutId}/exercises/${weId}/sets`, { method: 'POST', body: JSON.stringify(body) }),
      update: (workoutId: number, weId: number, setId: number, body: unknown) =>
        request(`/workouts/${workoutId}/exercises/${weId}/sets/${setId}`, { method: 'PUT', body: JSON.stringify(body) }),
      delete: (workoutId: number, weId: number, setId: number) =>
        request(`/workouts/${workoutId}/exercises/${weId}/sets/${setId}`, { method: 'DELETE' }),
    },
  },
  habits: {
    chart: (weeks = 52) => request<HabitDay[]>(`/habits/chart?weeks=${weeks}`),
  },
}
