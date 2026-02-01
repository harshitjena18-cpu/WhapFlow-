import { createBrowserRouter, Navigate } from 'react-router';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardViewModern } from './components/dashboard/DashboardViewModern';
import { AutomationsView } from './components/AutomationsView';
import { TemplatesView } from './components/TemplatesView';
import { AnalyticsView } from './components/AnalyticsView';
import { BillingView } from './components/BillingView';
import { SettingsView } from './components/SettingsView';
import { LandingPagePremium } from './components/LandingPagePremium';
import { Login } from './components/Login';
import { Signup } from './components/Signup';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPagePremium />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardViewModern />,
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