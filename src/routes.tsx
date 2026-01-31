import { createBrowserRouter } from 'react-router';
import { lazy, Suspense } from 'react';

// Lazy load components
const DashboardLayout = lazy(() => import('./components/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const LandingPageNew = lazy(() => import('./components/LandingPageNew').then(m => ({ default: m.LandingPageNew })));
const DashboardView = lazy(() => import('./components/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const AutomationsView = lazy(() => import('./components/AutomationsView').then(m => ({ default: m.AutomationsView })));
const TemplatesView = lazy(() => import('./components/TemplatesView').then(m => ({ default: m.TemplatesView })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const BillingView = lazy(() => import('./components/BillingView').then(m => ({ default: m.BillingView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./components/Signup').then(m => ({ default: m.Signup })));

// Loading component for top-level routes
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <LandingPageNew />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/signup',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Signup />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <DashboardLayout />
      </Suspense>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardView />,
      },
      {
        path: 'automations',
        element: <AutomationsView />,
      },
      {
        path: 'templates',
        element: <TemplatesView />,
      },
      {
        path: 'analytics',
        element: <AnalyticsView />,
      },
      {
        path: 'billing',
        element: <BillingView />,
      },
      {
        path: 'settings',
        element: <SettingsView />,
      },
    ],
  },
]);