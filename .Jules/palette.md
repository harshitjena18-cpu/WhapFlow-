## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-22 - Semantic Context for Trend Indicators
**Learning:** Purely visual trend indicators (arrows/colors) are inaccessible to screen readers. Using `sr-only` spans to provide explicit context (e.g., "Increase of") ensures that the directionality of data is communicated without cluttering the visual UI.
**Action:** Pair all directional icons in metrics/analytics with hidden descriptive text to satisfy WCAG perception requirements.
