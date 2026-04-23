## 2025-05-15 - Landmarks for Metric Clusters
**Learning:** Screen reader users benefit significantly from metric cards being identified as regions. Without landmarks, a dashboard of numbers feels like an undifferentiated list.
**Action:** Always wrap key metric cards in `role="region"` and provide a descriptive `aria-label`.

## 2025-05-15 - Ambiguous Trend Indicators
**Learning:** Arrow icons (Up/Down) are often visually intuitive but semantically opaque. Simply adding "18%" as text is insufficient for accessibility.
**Action:** Use `aria-label` on trend indicators to explicitly state "Increase of 18%" or "Decrease of 5%", providing directional context for screen readers.
