## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Standardizing Keyboard Focus Rings
**Learning:** The application uses a specific brand color for focus rings (`--ring`, `#25D366`). Using hardcoded colors (like Tailwind's default purple) or omitting focus rings creates a disjointed and inaccessible experience for keyboard users.
**Action:** Use `focus-visible:ring-2 focus-visible:ring-ring/20` (or `/40` for higher contrast) on all interactive elements to maintain accessibility and visual consistency with the Whapflow brand.
