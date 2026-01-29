import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Lookup from './pages/Lookup'
import Leaderboard from './pages/Leaderboard'
import Agent from './pages/Agent'
import Docs from './pages/Docs'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="lookup" element={<Lookup />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="agent/:id" element={<Agent />} />
        <Route path="docs" element={<Docs />} />
      </Route>
    </Routes>
  )
}
