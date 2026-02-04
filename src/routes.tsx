import { createBrowserRouter } from 'react-router';
import { DashboardLayout } from './components/DashboardLayout';

/**
 * Route-based Code Splitting using React Router's `lazy` property.
 * This optimizes the initial bundle size by loading view components only when navigated to.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { LandingPagePremium } = await import('./components/LandingPagePremium');
      return { Component: LandingPagePremium };
    },
  },
  {
    path: '/login',
    lazy: async () => {
      const { Login } = await import('./components/Login');
      return { Component: Login };
    },
  },
  {
    path: '/signup',
    lazy: async () => {
      const { Signup } = await import('./components/Signup');
      return { Component: Signup };
    },
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: 'dashboard',
        lazy: async () => {
          const { DashboardViewModern } = await import('./components/dashboard/DashboardViewModern');
          return { Component: DashboardViewModern };
        },
      },
      {
        path: 'automations',
        lazy: async () => {
          const { AutomationsView } = await import('./components/AutomationsView');
          return { Component: AutomationsView };
        },
      },
      {
        path: 'templates',
        lazy: async () => {
          const { TemplatesView } = await import('./components/TemplatesView');
          return { Component: TemplatesView };
        },
      },
      {
        path: 'analytics',
        lazy: async () => {
          const { AnalyticsView } = await import('./components/AnalyticsView');
          return { Component: AnalyticsView };
        },
      },
      {
        path: 'billing',
        lazy: async () => {
          const { BillingView } = await import('./components/BillingView');
          return { Component: BillingView };
        },
      },
      {
        path: 'settings',
        lazy: async () => {
          const { SettingsView } = await import('./components/SettingsView');
          return { Component: SettingsView };
        },
      },
    ],
  },
]);