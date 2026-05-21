## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Brand-Aligned High-Contrast Focus States
**Learning:** Default browser focus states often clash with brand identity or provide insufficient contrast on custom layouts. Using the primary brand color (`#25D366`) for `focus-visible` rings with a `ring-offset` creates a high-contrast, accessible, and aesthetically cohesive navigation experience that feels "built-in" to the design system.
**Action:** Apply `outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2` to all interactive components to ensure keyboard accessibility matches brand guidelines.
