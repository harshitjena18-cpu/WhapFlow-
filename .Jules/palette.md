## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Standardizing Tactile Feedback Scale
**Learning:** Inconsistent tactile feedback (e.g., using `active:scale-[0.98]` vs `active:scale-95`) creates a disjointed user experience where some interactions feel less responsive than others. Standardizing on `scale-95` (or `0.95` in Framer Motion) across all interactive elements (buttons, navigation items, cards) ensures a cohesive and predictable "feel" throughout the application.
**Action:** Use `active:scale-95` with `transition-all` for Tailwind-based components and `whileTap={{ scale: 0.95 }}` for Framer Motion components to provide consistent, perceptible tactile feedback.
