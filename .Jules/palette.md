## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - State-Driven Mobile Menu Navigation ARIA Properties
**Learning:** Mobile navigation hamburger menu triggers that rely on static labels and lack ARIA structural relationships make the application unusable for keyboard and screen-reader users, as they cannot perceive whether the sidebar expanded or what element it controls.
**Action:** Always equip mobile navigation toggles with state-driven dynamic ARIA properties (`aria-expanded`, `aria-controls="[id]"`, and dynamic `aria-label` transitioning between 'Open menu' and 'Close menu') to guarantee robust accessibility.
