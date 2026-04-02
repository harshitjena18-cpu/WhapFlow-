## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Component-Level Default Tooltip Delays
**Learning:** Tooltips without a delay can feel "jittery" or intrusive as they pop up instantly during casual mouse movement across the UI. Setting a default 300ms delay at the `TooltipProvider` level provides a more relaxed and intentional feel, while still allowing specific areas (like sidebars) to override it with `delayDuration={0}` for high-frequency interactions.
**Action:** Standardize Tooltip delays at the component definition level and ensure nested providers don't accidentally block global configuration.
