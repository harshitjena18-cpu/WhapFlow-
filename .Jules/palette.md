## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Contextual Screen Reader Support for Data Trends
**Learning:** Visual-only trend indicators (like up/down arrows) are inaccessible to screen reader users unless accompanied by descriptive text. Using a hidden span with "Increase of" or "Decrease of" provides the necessary semantic context without cluttering the visual UI.
**Action:** Always wrap visual status icons or arrows in a container that includes a `sr-only` descriptive span to ensure data directionality is communicated to all users.
