# Bolt's Journal - Whapflow SaaS Frontend

## 2025-05-14 - Initial Performance Audit
**Learning:** Found that all routes and large libraries (recharts, radix-ui) are bundled into the main entry point, leading to a suboptimal initial load time.
**Action:** Implement route-based code splitting using React Router's `lazy` feature to decrease initial bundle size.

## 2025-05-15 - Dashboard Caching & Lazy Loading
**Learning:** Found that navigating to the Dashboard consistently triggered a network request and loading state, even if data was recently fetched. Also identified that `LandingPageNew` and `DashboardLayout` were being bundled in the main entry point, delaying first paint.
**Action:** Implemented a module-level `requestCache` in `DashboardView.tsx` with a 5-minute TTL to provide instant feedback on return visits. Lazy loaded the remaining top-level components in `routes.tsx` to further optimize bundle size.
