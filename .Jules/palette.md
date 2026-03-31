## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Standardizing Interaction Indicators
**Learning:** Standardizing interactive elements with `focus-visible` ring indicators (e.g., `focus-visible:ring-2`) and `cursor-pointer` ensures clear visual feedback for keyboard and mouse navigation. Context-aware ring colors (e.g., green for sidebar, purple for header) maintain brand consistency while improving accessibility.
**Action:** Always audit interactive components (`Select`, `Switch`, `Button`) for missing `cursor-pointer` and ensuring high-contrast `focus-visible` states that match the component's zone.
