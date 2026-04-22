## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Trend Indicators
**Learning:** Numerical trends on dashboards are not universally "good" when increasing (e.g., Average Recovery Time). Hardcoding green for "up" and red for "down" can provide misleading visual feedback.
**Action:** When implementing trend indicators, include a mechanism (like an `isGood` or `inverse` prop) to determine color based on the metric's semantic meaning rather than just direction of change. Ensure screen readers receive the full context (e.g., "Decrease of 18%") via `sr-only` text.
