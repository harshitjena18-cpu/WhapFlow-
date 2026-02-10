## 2025-05-14 - [Notification Infrastructure]
**Learning:** UX feedback via toasts relies on a global provider. In a lazy-loaded or modular dashboard, always verify that the `Toaster` is mounted in the shared layout to prevent silent failures of `toast()` calls in individual views.
**Action:** Always check `DashboardLayout` or `App.tsx` for notification providers when implementing feedback loops in new components.

## 2025-05-15 - [Messaging UX: Character Limits & Personalization]
**Learning:** For messaging templates, tri-state color feedback for character counts (Gray < 90%, Orange < 100%, Bold Red > 100%) significantly reduces cognitive load by providing a "grace period" before an error state is reached. Additionally, providing one-click variable badges reduces friction and prevents syntax errors in manual variable typing.
**Action:** Implement multi-stage feedback for technical constraints and provide helper UI for complex syntax (like {{variables}}) in all future template editors.
