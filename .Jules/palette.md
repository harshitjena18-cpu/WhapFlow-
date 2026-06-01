## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Dynamic ARIA Labels for Stateful Toggles
**Learning:** For icon-only toggle buttons (like mobile menus), a static `aria-label` is insufficient as it doesn't reflect the current action. Providing dynamic labels (e.g., 'Open menu' vs 'Close menu') ensures screen reader users understand the exact consequence of their next interaction.
**Action:** Always implement state-aware `aria-label` and `title` (or Tooltip) attributes for interactive elements that toggle between distinct UI states.
