## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Unified Interactive Feedback for Navigation
**Learning:** In a dashboard with complex sidebars and headers, users benefit from consistent, subtle micro-interactions that confirm hit-target boundaries. Using the Tailwind `group` class on parent navigation items combined with `group-hover:scale-110` on nested icons provides a clear "delightful" feedback loop without layout shifts.
**Action:** Apply `group` to all primary navigation links and `group-hover:scale-110` to their associated icons/avatars to unify interactive feedback across the UI.
