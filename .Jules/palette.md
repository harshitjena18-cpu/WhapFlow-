## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Contextual Screen Reader Support for Trend Indicators
**Learning:** Decorative trend icons (up/down arrows) provide no information to screen reader users unless accompanied by `sr-only` text that describes the change (e.g., "Increase of"). Simply using `aria-label` on the parent card can be too noisy and miss the specific nuance of the trend.
**Action:** Always pair visual trend indicators with `sr-only` spans for directional context and apply `aria-hidden="true"` to the icons themselves.
