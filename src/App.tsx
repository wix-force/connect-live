import { lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { store } from '@/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequireAuth, RedirectIfAuth } from '@/components/auth/RequireAuth';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const JoinMeetingPage = lazy(() => import('./pages/JoinMeetingPage'));
const MeetingRoom = lazy(() => import('./pages/MeetingRoom'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient();

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
              <Route path="/register" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
              <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
              <Route path="/join/:code?" element={<RequireAuth><JoinMeetingPage /></RequireAuth>} />
              <Route path="/meeting/new" element={<RequireAuth><JoinMeetingPage /></RequireAuth>} />
              <Route path="/meeting/:id" element={<RequireAuth><MeetingRoom /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
