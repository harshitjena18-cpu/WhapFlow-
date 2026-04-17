## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Standardized Tactile Feedback and Icon-Only Accessibility
**Learning:** Standardizing tactile feedback (e.g., `active:scale-95`) across disparate UI components (Switch, Checkbox, Select) creates a cohesive "physical" feel. Additionally, icon-only buttons in navigation headers often lack sufficient context for both visual and screen-reader users; pairing a state-aware `aria-label` with a `Tooltip` (ideally with zero delay in navigation contexts) significantly improves discoverability and accessibility.
**Action:** Apply a uniform scale effect to all interactive elements and ensure all icon-only buttons have descriptive Tooltips and dynamic ARIA labels.
