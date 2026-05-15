## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Non-Visual Context for Trend Indicators
**Learning:** Dashboard trend indicators that rely exclusively on color and icons (arrows) are inaccessible to screen reader users and can be ambiguous for users with color blindness. Adding `sr-only` text to explicitly state "Increase" or "Decrease" provides critical verbal context.
**Action:** Always pair visual status indicators (like trend icons or colored badges) with `sr-only` text or descriptive `aria-labels` to ensure the information is perceivable by all users.
