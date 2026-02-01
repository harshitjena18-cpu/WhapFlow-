## 2024-05-24 - [Enhancing Deletion UX and Accessibility]
**Learning:** Native `window.confirm` breaks the immersion of a modern React app and lacks styling consistency. Replacing it with a themed `AlertDialog` improves the "delight" factor and allows for a state-driven UI. Adding `aria-label` to icon-only buttons is a non-negotiable requirement for accessible interfaces.
**Action:** Always prefer `AlertDialog` over `window.confirm`. Ensure `AlertDialogAction` supports themed variants (like `destructive`) to maintain visual hierarchy. Always provide descriptive labels for screen readers on icon-only interactive elements.

## 2026-02-01 - [Empty State Contextual Actions]
**Learning:** An empty state that only displays "No data found" is a dead end. Providing a clear, prominent call-to-action (CTA) button within the empty state helps guide the user and reduces friction for the first action.
**Action:** When implementing empty states, always include a relevant CTA button (e.g., "Create Template", "Add Item") that directs the user toward the primary intended action for that view.
