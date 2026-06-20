## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Tri-state Character Counters and CLS Prevention
**Learning:** In `TemplatesView.tsx`, validation message containers should be persistently rendered in the DOM to avoid breaking `aria-describedby` associations and to prevent Cumulative Layout Shift (CLS) when errors appear or disappear. Additionally, using Tailwind arbitrary variants targeting nested slots allows for dynamic styling of component indicators (like Shadcn's Progress bar) without custom CSS.
**Action:** Always maintain persistent containers for validation and character counts with `min-h` to stabilize the UI and ensure `aria-describedby` targets always exist.
