import { HashRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import AppShell from './components/AppShell'
import { SettingsProvider } from './context/SettingsContext'

export default function App() {
  return (
    <SettingsProvider>
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/project/:templateId" element={<ProjectPage />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </SettingsProvider>
  )
}
