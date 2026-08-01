## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-10-24 - Dual-Mode Menu Accessibility Association
**Learning:** When making hamburger and toggle menus accessible, simply adding `aria-expanded` or `aria-label` to the trigger button is insufficient for a seamless screen reader experience. The trigger button must explicitly reference the menu container using `aria-controls`, and the target container must have the corresponding matching `id`. This explicitly binds the controls for screen readers, ensuring a smooth navigation transition and clear structure.
**Action:** Always link mobile triggers to their target drawer/aside elements using `aria-controls` and `id`, and ensure the `aria-label` dynamically reflects the state (e.g., "Open menu" vs "Close menu").
