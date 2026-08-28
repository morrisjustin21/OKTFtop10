import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Leaderboard from './pages/Leaderboard.jsx'
import Admin from './pages/Admin.jsx'
import AthleteProfile from './pages/AthleteProfile.jsx'
import PrintReport from './pages/PrintReport.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/athlete/:athleteId" element={<AthleteProfile />} />
        <Route path="/print" element={<PrintReport />} />
      </Routes>
    </BrowserRouter>
  )
}
