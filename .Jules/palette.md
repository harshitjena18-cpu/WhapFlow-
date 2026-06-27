## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Persistent ARIA Descriptors for Dynamic Forms
**Learning:** When using `aria-describedby` for validation messages or character counters, the target element should persist in the DOM even if empty. Dynamically mounting/unmounting the descriptor container can cause assistive technologies to lose context or fail to announce changes when the field first gains focus or transitions from valid to invalid.
**Action:** Always render descriptor containers with persistent IDs, using conditional styling (e.g., hidden or empty contents) rather than conditional rendering to maintain stable accessibility associations.
