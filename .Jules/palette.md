## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-20 - Directional Context for Trend Indicators
**Learning:** Visual-only trend indicators (colored arrows/percentages) in dashboard cards are inaccessible to screen readers. Sighted users infer "increase" or "decrease" from color and icons, but screen readers only announce the number. Adding `sr-only` text (e.g., "Increase of") provides the missing directional context without cluttering the UI.
**Action:** Always include hidden directional labels (`sr-only`) when using icons or color as the primary indicator of change or status.

## 2025-05-20 - Unified Focus Indicators for Brand Cohesion
**Learning:** Inconsistent focus indicators across different layout regions (Sidebar vs. Main Content) create a fragmented experience for keyboard users. Standardizing on a brand-colored ring (`focus-visible:ring-[#25D366]/50`) across all interactive components improves both accessibility and visual brand alignment.
**Action:** Apply a consistent `focus-visible` style using the primary brand color to all custom interactive elements.
