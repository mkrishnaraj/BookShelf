import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import clsx from 'clsx'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import OfflineBanner from '../ui/OfflineBanner'
import FeedbackWidget from '../ui/FeedbackWidget'
import { useUiStore } from '../../stores/uiStore'

interface AppShellProps {
  children: React.ReactNode
}

function useMobileBreakpoint() {
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)

  useEffect(() => {
    function handleResize() {
      setSidebarOpen(window.innerWidth >= 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-shelf-500 border-t-transparent" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  return <>{children}</>
}

export default function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  useMobileBreakpoint()

  return (
    <>
      <OfflineBanner />
      <SignedIn>
        <div className="flex h-screen overflow-hidden bg-ink text-slate-200">
          {/* Desktop sidebar */}
          <div
            className={clsx(
              'hidden md:flex md:flex-shrink-0 transition-all duration-200',
              sidebarOpen ? 'md:w-60' : 'md:w-0 md:overflow-hidden',
            )}
          >
            <Sidebar />
          </div>

          {/* Main content */}
          <main
            className="flex-1 overflow-y-auto pb-16 md:pb-0"
            id="main-content"
          >
            {children}
          </main>

          {/* Mobile bottom nav */}
          <div className="md:hidden">
            <BottomNav />
          </div>

          <FeedbackWidget />
        </div>
      </SignedIn>

      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  )
}
