## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-14 - Standardizing Tactile Feedback Scale
**Learning:** Inconsistent `active:scale` values (e.g., 0.98 vs 0.95) across different UI layers (Tailwind vs Framer Motion) create a subtle sense of "jank" and lack of polish. Standardizing on `scale-95` for mobile-friendly tactile feedback ensures a consistent and intentional interaction language.
**Action:** Use `active:scale-95` and `transition-all` for Tailwind buttons and `whileTap={{ scale: 0.95 }}` for Framer Motion components to ensure unified tactile feedback.

## 2025-05-14 - Accessible Accordion Patterns for Custom UI
**Learning:** Custom-built interactive sections (like FAQs) often omit critical WAI-ARIA attributes (`aria-expanded`, `aria-controls`, `role="region"`) required for screen reader compatibility, especially when they bypass the standard UI library.
**Action:** Always implement the full WAI-ARIA Accordion pattern for collapsible sections to ensure they are discoverable and usable by assistive technologies.
