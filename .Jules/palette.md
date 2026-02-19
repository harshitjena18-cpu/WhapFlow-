## 2025-05-14 - [Notification Infrastructure]
**Learning:** UX feedback via toasts relies on a global provider. In a lazy-loaded or modular dashboard, always verify that the `Toaster` is mounted in the shared layout to prevent silent failures of `toast()` calls in individual views.
**Action:** Always check `DashboardLayout` or `App.tsx` for notification providers when implementing feedback loops in new components.

## 2025-05-15 - [Messaging UX: Character Limits & Personalization]
**Learning:** For messaging templates, tri-state color feedback for character counts (Gray < 90%, Orange < 100%, Bold Red > 100%) significantly reduces cognitive load by providing a "grace period" before an error state is reached. Additionally, providing one-click variable badges reduces friction and prevents syntax errors in manual variable typing.
**Action:** Implement multi-stage feedback for technical constraints and provide helper UI for complex syntax (like {{variables}}) in all future template editors.

## 2025-05-16 - [Dynamic Keyboard Shortcut Hints]
**Learning:** Hardcoding platform-specific keyboard symbols (like ⌘) alienates Windows and Linux users and provides inaccurate instructions. Using `navigator.userAgent` to dynamically swap between ⌘ and Ctrl ensures a localized and professional experience. Furthermore, keyboard hints should always be accompanied by a functional event listener to "close the loop" between instruction and action.
**Action:** Always detect OS for keyboard-based hints and ensure the corresponding `keydown` logic is implemented for both `Meta` (Mac) and `Control` (Win/Linux) keys.

## 2025-05-18 - [Tokenized Variables UX]
**Learning:** Representing technical placeholders (like {{customer_name}}) as pill-shaped "tokens" rather than plain text or standard buttons makes them feel more like distinct, reusable entities. Combining these with tooltips that describe the underlying data source provides immediate clarity without cluttering the UI.
**Action:** Use the "Chip/Pill" pattern for variable insertion UI, ensuring each token has a descriptive tooltip and an accessible `aria-label`.

## 2025-05-19 - [Accessible Tooltips on Interactive Components]
**Learning:** When using `TooltipTrigger asChild` with interactive components like `Switch` or `Button`, wrapping the child in a `div` or `span` can break keyboard focus propagation to the tooltip trigger. The tooltip will work on hover but fail to show on Tab focus, reducing accessibility for keyboard users.
**Action:** Always ensure the interactive component is the direct child of `TooltipTrigger` when `asChild` is used, and avoid redundant wrapper elements that swallow focus events.
