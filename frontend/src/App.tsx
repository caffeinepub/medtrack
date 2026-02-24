import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useNavigate,
} from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AddRecordPage } from './pages/AddRecordPage';
import { TimelinePage } from './pages/TimelinePage';
import { AnalysisPage } from './pages/AnalysisPage';
import { LoginPage } from './pages/LoginPage';
import { useInternetIdentity } from './hooks/useInternetIdentity';

// Root route — bare outlet, no shell
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route — standalone page, no auth required
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Protected layout route — wraps all authenticated pages
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: ProtectedLayout,
});

// Authenticated child routes
const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: HomePage,
});

const addRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/add',
  component: AddRecordPage,
});

const timelineRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/timeline',
  component: TimelinePage,
});

const analysisRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/analysis',
  component: AnalysisPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([indexRoute, addRoute, timelineRoute, analysisRoute]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Protected layout: redirects to /login if not authenticated, then renders Layout
function ProtectedLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  if (isInitializing || !isAuthenticated) return null;

  return <Layout />;
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
}
