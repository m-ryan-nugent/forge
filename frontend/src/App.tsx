import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { WorkoutLogger } from './pages/WorkoutLogger'
import { ExerciseLibrary } from './pages/ExerciseLibrary'
import { WorkoutHistory } from './pages/WorkoutHistory'
import { Progress } from './pages/Progress'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="workout" element={<WorkoutLogger />} />
          <Route path="exercises" element={<ExerciseLibrary />} />
          <Route path="history" element={<WorkoutHistory />} />
          <Route path="progress" element={<Progress />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
