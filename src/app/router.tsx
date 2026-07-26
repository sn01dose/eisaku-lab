import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { useAppState } from './providers/AppStateProvider'
import { AppShell, Button, Card } from '../components'

const DiagnosticPage = lazy(() =>
  import('../pages/DiagnosticPage').then((module) => ({
    default: module.DiagnosticPage,
  })),
)
const DiagnosticResultPage = lazy(() =>
  import('../pages/DiagnosticResultPage').then((module) => ({
    default: module.DiagnosticResultPage,
  })),
)
const HomePage = lazy(() =>
  import('../pages/HomePage').then((module) => ({ default: module.HomePage })),
)
const NotesPage = lazy(() =>
  import('../pages/NotesPage').then((module) => ({ default: module.NotesPage })),
)
const OnboardingPage = lazy(() =>
  import('../pages/OnboardingPage').then((module) => ({
    default: module.OnboardingPage,
  })),
)
const ProgressPage = lazy(() =>
  import('../pages/ProgressPage').then((module) => ({
    default: module.ProgressPage,
  })),
)
const ReportPage = lazy(() =>
  import('../pages/ReportPage').then((module) => ({
    default: module.ReportPage,
  })),
)
const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)
const SimplifyPage = lazy(() =>
  import('../pages/SimplifyPage').then((module) => ({
    default: module.SimplifyPage,
  })),
)
const SpellingPage = lazy(() =>
  import('../pages/SpellingPage').then((module) => ({
    default: module.SpellingPage,
  })),
)
const StagesPage = lazy(() =>
  import('../pages/StagesPage').then((module) => ({
    default: module.StagesPage,
  })),
)
const TeacherPage = lazy(() =>
  import('../pages/TeacherPage').then((module) => ({
    default: module.TeacherPage,
  })),
)
const TodayPage = lazy(() =>
  import('../pages/TodayPage').then((module) => ({ default: module.TodayPage })),
)
const WritingPage = lazy(() =>
  import('../pages/WritingPage').then((module) => ({
    default: module.WritingPage,
  })),
)
const WritingFeedbackImportPage = lazy(() =>
  import('../pages/WritingFeedbackImportPage').then((module) => ({
    default: module.WritingFeedbackImportPage,
  })),
)

function ScrollToTop(): null {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

function ProfileGate({ children }: { children: ReactNode }): React.JSX.Element {
  const { state } = useAppState()
  if (!state.profile) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function NotFoundPage(): React.JSX.Element {
  return (
    <AppShell>
      <Card label="ページ案内">
        <h1>ページが見つかりませんでした。</h1>
        <p>ホームから学習を続けられます。</p>
        <Button fullWidth onClick={() => (window.location.hash = '#/')}>
          ホームへ戻る
        </Button>
      </Card>
    </AppShell>
  )
}

export function AppRouter(): React.JSX.Element {
  return (
    <HashRouter>
      <ScrollToTop />
      <Suspense
        fallback={
          <AppShell hideNavigation>
            <p className="route-loading" role="status">
              学習内容を準備しています。
            </p>
          </AppShell>
        }
      >
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route
            path="/diagnostic"
            element={
              <ProfileGate>
                <DiagnosticPage />
              </ProfileGate>
            }
          />
          <Route
            path="/diagnostic/result"
            element={
              <ProfileGate>
                <DiagnosticResultPage />
              </ProfileGate>
            }
          />
          <Route path="/teacher" element={<TeacherPage />} />
          <Route
            path="*"
            element={
              <ProfileGate>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/today" element={<TodayPage />} />
                  <Route path="/spelling" element={<SpellingPage />} />
                  <Route path="/writing" element={<WritingPage />} />
                  <Route
                    path="/writing/feedback/:essayId"
                    element={<WritingFeedbackImportPage />}
                  />
                  <Route path="/simplify" element={<SimplifyPage />} />
                  <Route
                    path="/notes"
                    element={
                      <AppShell activePath="/notes">
                        <NotesPage />
                      </AppShell>
                    }
                  />
                  <Route
                    path="/stages"
                    element={
                      <AppShell activePath="/stages">
                        <StagesPage />
                      </AppShell>
                    }
                  />
                  <Route
                    path="/progress"
                    element={
                      <AppShell activePath="/progress">
                        <ProgressPage />
                      </AppShell>
                    }
                  />
                  <Route path="/report" element={<ReportPage />} />
                  <Route
                    path="/settings"
                    element={
                      <AppShell activePath="/settings">
                        <SettingsPage />
                      </AppShell>
                    }
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </ProfileGate>
            }
          />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
