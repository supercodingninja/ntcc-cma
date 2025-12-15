import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Songs from './pages/Songs'
import SongDetail from './pages/SongDetail'
import AddSong from './pages/AddSong'
import EditSong from './pages/EditSong'
import PracticeHistory from './pages/PracticeHistory'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Profile from './pages/Profile'
import Memorial from './pages/Memorial'
import Leadership from './pages/Leadership'
import Practice from './pages/Practice'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function EditorRoute({ children }) {
  const { isEditor, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isEditor()) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/songs"
            element={
              <ProtectedRoute>
                <Songs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/songs/:id"
            element={
              <ProtectedRoute>
                <SongDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice-history"
            element={
              <ProtectedRoute>
                <PracticeHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <Practice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/songs/add"
            element={
              <EditorRoute>
                <AddSong />
              </EditorRoute>
            }
          />
          <Route
            path="/songs/:id/edit"
            element={
              <EditorRoute>
                <EditSong />
              </EditorRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <AdminRoute>
                <Reports />
              </AdminRoute>
            }
          />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />

          <Route
            path="/memorial"
            element={
              <ProtectedRoute>
                <Memorial />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leadership"
            element={
              <ProtectedRoute>
                <Leadership />
              </ProtectedRoute>
            }
          />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  )
}

export default App
