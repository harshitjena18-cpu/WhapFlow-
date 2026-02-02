## 2024-05-24 - [Enhancing Deletion UX and Accessibility]
**Learning:** Native `window.confirm` breaks the immersion of a modern React app and lacks styling consistency. Replacing it with a themed `AlertDialog` improves the "delight" factor and allows for a state-driven UI. Adding `aria-label` to icon-only buttons is a non-negotiable requirement for accessible interfaces.
**Action:** Always prefer `AlertDialog` over `window.confirm`. Ensure `AlertDialogAction` supports themed variants (like `destructive`) to maintain visual hierarchy. Always provide descriptive labels for screen readers on icon-only interactive elements.

## 2025-05-15 - [Global Search Accessibility and Shortcuts]
**Learning:** Global search inputs often lack proper accessibility labels and quick-access shortcuts, which can hinder both screen-reader users and power users. Implementing a standard `Cmd/Ctrl + K` shortcut and a visible hint improves discoverability and speed of use.
**Action:** Ensure all primary search inputs have an `id`, a corresponding `label` (even if `sr-only`), and a standardized keyboard shortcut listener. Use `<kbd>` elements to visually communicate shortcuts to users.
