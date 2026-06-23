## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Accessible Character Limits and Layout Stability
**Learning:** Character counters require `aria-live` to be accessible, and visual tri-state indicators (Green/Orange/Red) help users manage limits intuitively. Furthermore, conditionally rendering validation messages causes Cumulative Layout Shift (CLS) and breaks `aria-describedby` associations; using persistent containers prevents this.
**Action:** Implement `aria-live` counters with color-coded progress bars and use persistent validation containers to maintain layout stability and accessibility.
