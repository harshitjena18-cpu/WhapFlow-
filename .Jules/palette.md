## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Robust ARIA Associations for Dynamic Forms
**Learning:** Using `aria-describedby` to link inputs with validation messages or character counters improves accessibility, but if the target container is conditionally rendered (e.g., `{errors.length > 0 && <div id="err">...</div>}`), the link breaks when no errors exist, which can confuse screen readers.
**Action:** Ensure ARIA description containers exist in the DOM persistently (even if empty) to maintain programmatic associations throughout the component's lifecycle.
