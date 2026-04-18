## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Avoiding Redundant Screen Reader Announcements in Badges
**Learning:** Using `aria-label` on a container that also contains visible text results in screen readers announcing both the label and the internal text, creating a repetitive and confusing experience.
**Action:** When adding directional icons (like arrows) to badges with visible text, use `sr-only` text for the context (e.g., "Increase of") and mark the icon as `aria-hidden="true"`. This ensures the screen reader hears a single, coherent phrase.
