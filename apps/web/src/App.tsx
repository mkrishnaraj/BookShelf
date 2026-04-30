import { Routes, Route } from 'react-router-dom'
import { SignIn, SignUp } from '@clerk/clerk-react'
import AppShell, { ProtectedRoute } from './components/layout/AppShell'

import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import ShelfView from './pages/ShelfView'
import Stats from './pages/Stats'
import Notebook from './pages/Notebook'
import Wishlist from './pages/Wishlist'
import Settings from './pages/Settings'
import Store from './pages/Store'
import SellerDashboard from './pages/SellerDashboard'
import Pricing from './pages/Pricing'
import PublicShelf from './pages/PublicShelf'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/s/:slug" element={<PublicShelf />} />
      <Route
        path="/sign-in/*"
        element={
          <div className="min-h-screen bg-ink flex items-center justify-center">
            <SignIn routing="path" path="/sign-in" afterSignInUrl="/dashboard" />
          </div>
        }
      />
      <Route
        path="/sign-up/*"
        element={
          <div className="min-h-screen bg-ink flex items-center justify-center">
            <SignUp routing="path" path="/sign-up" afterSignUpUrl="/dashboard" />
          </div>
        }
      />

      {/* Protected routes — wrapped in AppShell */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shelf/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <ShelfView />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <AppShell>
              <Stats />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notebook"
        element={
          <ProtectedRoute>
            <AppShell>
              <Notebook />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wishlist"
        element={
          <ProtectedRoute>
            <AppShell>
              <Wishlist />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppShell>
              <Settings />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/store"
        element={
          <ProtectedRoute>
            <AppShell>
              <Store />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller"
        element={
          <ProtectedRoute>
            <AppShell>
              <SellerDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
