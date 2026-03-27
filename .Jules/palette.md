## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Standardizing Tactile Feedback and ARIA Accordion Patterns
**Learning:** Standardizing tactile feedback (press scales) and implementing full WAI-ARIA patterns for custom accordions significantly improves both the "feel" of the UI and accessibility for screen reader users. A consistent `active:scale-95` provides better visual affordance than subtler `0.98` scales on interactive elements.
**Action:** Use `active:scale-95` with `transition-all` as the project standard for interactive element feedback, and ensure all custom disclosure components (like accordions) implement `aria-expanded`, `aria-controls`, and `role="region"`.
