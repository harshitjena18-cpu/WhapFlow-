## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Sidebar Profile Accessibility and Tooltips
**Learning:** Sidebar user profiles often use truncated text for long names or emails to maintain layout integrity, but this hides information from users. Adding `title` attributes provides a low-effort, native tooltip for truncated content, and ensuring the `group` class is present allows nested hover effects (like background changes) to trigger correctly on the entire container.
**Action:** Always wrap truncated text in elements with `title` attributes and ensure container-level hover/focus states are properly propagated to nested elements using Tailwind `group`.
