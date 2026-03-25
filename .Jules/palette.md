## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2026-03-25 - Standardizing Tactile Feedback and Accordion Accessibility
**Learning:** Inconsistent tactile scales (e.g., `scale-95` vs `scale-[0.98]`) create a disjointed user experience where some interactions feel "mushier" than others. Additionally, visual-only accordions without `aria-expanded` and `aria-controls` fail WCAG 2.1 accessibility standards.
**Action:** Always use the project's standard `active:scale-95` for consistent tactile feedback. Ensure all accordion-style interactions explicitly manage ARIA states to maintain screen reader accessibility.
