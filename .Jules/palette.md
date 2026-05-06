## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Coordinated Navigation Hover Animations
**Learning:** Adding subtle scaling animations to icons or avatars within navigation links provides immediate, delightful visual feedback that clarifies which item is being interacted with. Using Tailwind's `group` utility on the parent link and `group-hover:scale-110` on the child icon ensures a synchronized response.
**Action:** Use coordinated `group-hover` transformations for interactive list items and navigation links to enhance perceived responsiveness and quality.
