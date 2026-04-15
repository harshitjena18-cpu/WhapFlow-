## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Region-Specific ARIA Labels for Repeated Navigation
**Learning:** When identical interactive elements (like a user profile link) appear in multiple layout regions (Header, Sidebar), using the same generic ARIA label can confuse screen reader users during navigation. Adding the region name to the label (e.g., "User Profile (Sidebar)") provides necessary context.
**Action:** Always distinguish repeated navigational elements with unique, region-specific `aria-label` values to ensure unambiguous navigation.
