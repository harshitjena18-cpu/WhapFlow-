## 2025-05-14 - [Notification Infrastructure]
**Learning:** UX feedback via toasts relies on a global provider. In a lazy-loaded or modular dashboard, always verify that the `Toaster` is mounted in the shared layout to prevent silent failures of `toast()` calls in individual views.
**Action:** Always check `DashboardLayout` or `App.tsx` for notification providers when implementing feedback loops in new components.

## 2025-05-15 - [Messaging UX: Character Limits & Personalization]
**Learning:** For messaging templates, tri-state color feedback for character counts (Gray < 90%, Orange < 100%, Bold Red > 100%) significantly reduces cognitive load by providing a "grace period" before an error state is reached. Additionally, providing one-click variable badges reduces friction and prevents syntax errors in manual variable typing.
**Action:** Implement multi-stage feedback for technical constraints and provide helper UI for complex syntax (like {{variables}}) in all future template editors.

## 2025-05-16 - [Dynamic Keyboard Shortcut Hints]
**Learning:** Hardcoding platform-specific keyboard symbols (like ⌘) alienates Windows and Linux users and provides inaccurate instructions. Using `navigator.userAgent` to dynamically swap between ⌘ and Ctrl ensures a localized and professional experience. Furthermore, keyboard hints should always be accompanied by a functional event listener to "close the loop" between instruction and action.
**Action:** Always detect OS for keyboard-based hints and ensure the corresponding `keydown` logic is implemented for both `Meta` (Mac) and `Control` (Win/Linux) keys.

## 2025-05-17 - [Auth Loading States & Accessible Icons]
**Learning:** Auth forms without immediate visual feedback (spinners) on submission lead to double-clicking and user frustration. Standardizing on `Loader2` from `lucide-react` with `animate-spin` provides consistent perceived performance. Additionally, icon-only buttons in the dashboard (like 'More' menus) must have explicit `aria-label` attributes to be navigable via screen readers, as the icon itself provides no semantic meaning.
**Action:** Use `isLoading` patterns with `Loader2` for all async actions and audit icon-only buttons for missing ARIA labels.
