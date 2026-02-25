import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import SetHandleModal from './components/SetHandleModal'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Calendar from './pages/Calendar'
import AdminPanel from './components/AdminPanel'
import Profile from './pages/Profile'
import UserSearch from './pages/UserSearch'

function AppInner() {
  const { needsHandle, authLoading } = useAuth()

  return (
    <>
      {needsHandle && !authLoading && <SetHandleModal />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
        <Route path="/profile/:handle" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><UserSearch /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppInner />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
