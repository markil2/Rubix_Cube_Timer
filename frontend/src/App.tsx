import { AnimatePresence } from 'motion/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { TimerPage } from './pages/TimerPage'
import { HistoryPage } from './pages/HistoryPage'
import { StatsPage } from './pages/StatsPage'
import { ProfilePage } from './pages/ProfilePage'
import { useEffect } from 'react'

export function App() {
  const location = useLocation()

  // New page starts at the top once the old one has left.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      <Header />
      <AnimatePresence mode="wait" initial>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<TimerPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<TimerPage />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
