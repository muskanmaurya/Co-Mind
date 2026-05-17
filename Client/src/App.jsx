import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthForm from './pages/Auth/AuthForm'
import NotesList from './pages/Dashboard/NotesList'
import NoteEditor from './pages/Editor/NoteEditor'
import PublicSharePage from './pages/Shared/PublicSharePage'
import NotFound from './pages/NotFound/NotFound'
import './App.css'

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-sky-wallpaper bg-cover bg-fixed bg-center px-4 py-6 md:px-8 md:py-8">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-300/45 via-sky-200/30 to-sky-100/30" />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/signup" element={<AuthForm mode="signup" />} />

          <Route
            path="/dashboard"
            element={<ProtectedRoute><NotesList /></ProtectedRoute>}
          />
          <Route
            path="/notes"
            element={<ProtectedRoute><NotesList /></ProtectedRoute>}
          />
          <Route
            path="/notes/:id"
            element={<ProtectedRoute><NoteEditor /></ProtectedRoute>}
          />
          <Route
            path="/workspace/:id"
            element={<ProtectedRoute><NoteEditor /></ProtectedRoute>}
          />

          <Route path="/shared/:shareId" element={<PublicSharePage />} />

          <Route path="*" element={<NotFound />} />

        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App