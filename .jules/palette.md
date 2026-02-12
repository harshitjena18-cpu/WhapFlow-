## 2024-05-24 - [Enhancing Deletion UX and Accessibility]
**Learning:** Native `window.confirm` breaks the immersion of a modern React app and lacks styling consistency. Replacing it with a themed `AlertDialog` improves the "delight" factor and allows for a state-driven UI. Adding `aria-label` to icon-only buttons is a non-negotiable requirement for accessible interfaces.
**Action:** Always prefer `AlertDialog` over `window.confirm`. Ensure `AlertDialogAction` supports themed variants (like `destructive`) to maintain visual hierarchy. Always provide descriptive labels for screen readers on icon-only interactive elements.

## 2025-05-15 - [Global Search Accessibility and Shortcuts]
**Learning:** Global search inputs often lack proper accessibility labels and quick-access shortcuts, which can hinder both screen-reader users and power users. Implementing a standard `Cmd/Ctrl + K` shortcut and a visible hint improves discoverability and speed of use.
**Action:** Ensure all primary search inputs have an `id`, a corresponding `label` (even if `sr-only`), and a standardized keyboard shortcut listener. Use `<kbd>` elements to visually communicate shortcuts to users.

## 2025-05-24 - [Clipboard Feedback and Actionable Tooltips]
**Learning:** Copy-to-clipboard actions without visual feedback leave users uncertain. Using a temporary success state (e.g., swapping a "Copy" icon for a "Check" icon) provides immediate confirmation. Wrapping icon-only actions in tooltips ensures they are discoverable and accessible without cluttering the UI with text.
**Action:** Always provide a visual "success" state for clipboard actions. Ensure all icon-only buttons have descriptive tooltips that explain the action on hover/focus.

## 2025-05-24 - [Granular Clipboard State Management]
**Learning:** Using a single boolean state for multiple copy-to-clipboard buttons on a single page leads to a confusing UI where all buttons show a "copied" state simultaneously. Transitioning to an ID-based state (`copiedId`) allows for granular, independent feedback for each action, providing a much clearer and more intuitive experience.
**Action:** When a page contains multiple independent clipboard triggers (e.g., in a list or table), use an ID-based state tracker instead of a boolean to ensure feedback is scoped to the specific element the user interacted with.

## 2026-05-24 - [Password Visibility Toggles and Form Accessibility]
**Learning:** Auth forms significantly benefit from password visibility toggles, especially on mobile or for complex passwords. Using independent states for "Password" and "Confirm Password" prevents accidental disclosure and reduces friction. Ensuring these toggles use `type="button"` prevents accidental form submissions.
**Action:** Always include password visibility toggles in Auth forms. Use `aria-label` to clearly communicate the toggle state to screen readers. Ensure toggle buttons are within a `relative` container and do not interfere with the input's focus state.
