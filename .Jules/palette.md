## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Coordinated Hover Feedback for Interactive Containers
**Learning:** Interactive list items or navigation links feel more responsive and "alive" when child icons or avatars provide coordinated visual feedback (e.g., scaling) alongside the container's background change. Using Tailwind's `group` utility ensures the animation triggers even if the user hovers over the text label instead of the icon directly.
**Action:** Use `group` on parent containers and `group-hover:scale-110` with `transition-transform` on nested decorative icons or avatars to provide immediate, delightful micro-feedback.
