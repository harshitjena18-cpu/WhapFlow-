## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Standardizing Tactile Feedback and Focus Rings
**Learning:** Inconsistent interaction scales (e.g., `scale-98` vs `scale-95`) and hardcoded focus ring colors create a fragmented user experience. Standardizing on a more perceptible scale (`scale-95`) and using brand-aligned focus tokens (`ring-ring/20`) significantly improves the "feel" and accessibility of the interface.
**Action:** Standardize interactive elements to `active:scale-95` and use `focus-visible:ring-ring/20` for all dashboard and navigation components to ensure a cohesive tactile and visual language.
