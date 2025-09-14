import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { ExpertPersonas } from './pages/ExpertPersonas'
import { PlatformAccounts } from './pages/PlatformAccounts'
import { AuthorityContent } from './pages/AuthorityContent'
import { Navigation } from './components/Navigation'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expert-personas" element={<ExpertPersonas />} />
            <Route path="/platform-accounts" element={<PlatformAccounts />} />
            <Route path="/authority-content" element={<AuthorityContent />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App