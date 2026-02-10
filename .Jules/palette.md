## 2025-05-14 - [Notification Infrastructure]
**Learning:** UX feedback via toasts relies on a global provider. In a lazy-loaded or modular dashboard, always verify that the `Toaster` is mounted in the shared layout to prevent silent failures of `toast()` calls in individual views.
**Action:** Always check `DashboardLayout` or `App.tsx` for notification providers when implementing feedback loops in new components.
