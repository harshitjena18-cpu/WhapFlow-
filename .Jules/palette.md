## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Standardizing Feedback and Focus Indicators
**Learning:** Inconsistent tactile feedback (e.g., `active:scale-[0.98]` vs `active:scale-95`) and missing focus indicators on main navigation items can lead to a fragmented and inaccessible user experience. Centralizing these patterns around a project standard improves both visual polish and accessibility.
**Action:** Apply `active:scale-95` for tactile feedback and ensure `focus-visible:ring-2` is present on all high-level interactive navigation elements.
