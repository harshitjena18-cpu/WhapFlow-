## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Preserving Directional Context in Analytics
**Learning:** When replacing text-based trend indicators (e.g., ↑/↓ arrows) with purely visual icons, directional context is lost for screen reader users. Additionally, standard "success" green colors like `emerald-600` often fail WCAG AA contrast ratios (4.5:1) for small text on white backgrounds.
**Action:** Always wrap visual trend indicators in a container with a descriptive `aria-label` (e.g., "12.5% increase") and use darker color variants (e.g., `emerald-700`) to ensure accessibility for both screen reader and low-vision users.
