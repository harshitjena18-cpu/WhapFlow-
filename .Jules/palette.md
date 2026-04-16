## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Standardizing Tactile Feedback and Regional ARIA Context
**Learning:** Standardizing tactile interaction (e.g., `active:scale-95`) across all interactive primitives (Switch, Checkbox, Tabs) significantly improves the perceived responsiveness of the UI. Additionally, when identical interactive elements (like Profile links) appear in different layout regions (Header vs. Sidebar), using region-specific ARIA labels prevents ambiguity for screen reader users navigating by link lists.
**Action:** Apply a consistent `active:scale-95` transition to all core interactive components and use descriptive, region-prefixed `aria-label` attributes for recurring navigational elements.
