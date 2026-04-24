## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion in Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., "Avg. Recovery Time", "Error Rate"), standard green-up/red-down coloring is misleading. Implementing an `isGood` prop for trend indicators allows semantic inversion, ensuring that a "down" trend correctly uses success colors (Emerald) when it represents an improvement.
**Action:** Always evaluate the semantic meaning of a metric change before applying success/warning colors to trend indicators.

## 2025-05-15 - Accessible Trend Context
**Learning:** Visual-only trend indicators (colored arrows) are opaque to screen reader users. Including `sr-only` descriptive text (e.g., "Increase of" or "Decrease of") within the badge provides critical directional context without cluttering the visual UI.
**Action:** Use `sr-only` spans to provide semantic direction for all icon-based trend or status indicators.
