import { HashRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { SettingsProvider } from './context/SettingsContext'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'

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
