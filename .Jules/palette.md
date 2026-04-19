## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Contextual Labels for Trend Indicators
**Learning:** Symbols like "↑" or "↓" in trend indicators are insufficient for screen readers. Providing hidden contextual labels (e.g., `<span className="sr-only">Increase of</span>`) alongside the value ensures the data is accessible.
**Action:** When using directional symbols or color-only status indicators, always include screen-reader-only text to describe the change or state.
