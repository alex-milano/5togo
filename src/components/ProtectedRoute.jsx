import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Wraps a route so only authenticated users can access it.
 * If requireAdmin=true, also requires the user to have role 'admin'.
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, userRole, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">5toGo</div>
        <div className="spinner" />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/app" replace />
  }

  return children
}
