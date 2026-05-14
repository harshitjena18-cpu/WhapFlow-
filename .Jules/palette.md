## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Dynamic IDs for Label Association
**Learning:** Using static hardcoded IDs for `Label` associations (e.g., `id="toggle"`) within views that render dynamic data or could be reused leads to DOM ID collisions. This breaks accessibility for subsequent elements as the label will always trigger the first element with that ID.
**Action:** Always use dynamic, unique IDs derived from entity IDs (e.g., `id={`enable-${item.id}`}`) for form controls in list-based or multi-item views.
