## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-07-29 - State-Driven ARIA Properties for Hamburger Menus
**Learning:** Icon-only toggle buttons (like mobile hamburger menus) must dynamically update their ARIA states to be fully accessible. Lacking `aria-expanded` and `aria-controls` prevents screen readers from understanding the overlay visibility, while a static label like "Toggle menu" does not communicate the active action.
**Action:** Always bind `aria-expanded` dynamically to the open state, set `aria-controls` to the container ID, use a dynamic `aria-label` (e.g., "Open menu" vs "Close menu"), and wrap the element in a Tooltip.
