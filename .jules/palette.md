# Palette's Journal - UX & Accessibility Learnings

## 2025-05-14 - [A11y: Converting Non-Semantic Elements to Interactive Components]
**Learning:** In many modern React applications, user profiles or navigation items are often built using `div` elements with `onClick` handlers. While this works for mouse users, it completely excludes keyboard users and screen readers as these elements are not focusable and lack semantic meaning.
**Action:** Always convert interactive `div` containers to semantic `button` elements (or `a` if they navigate). When using icon-only buttons, ensure an `aria-label` is present to provide context to assistive technologies.

## 2025-05-14 - [Build: JSX in .ts files]
**Learning:** Vite/esbuild will fail to parse JSX syntax in files with a `.ts` extension.
**Action:** Ensure all files containing JSX/TSX use the `.tsx` extension to avoid build-time errors.

## 2025-05-15 - [UX Pattern: Themed Destructive Actions]
**Learning:** Browser-native `window.confirm` breaks the visual immersion and branding of a modern SaaS application. Using a themed `AlertDialog` provides a more cohesive experience and allows for better styling of "destructive" actions (e.g., using red color tokens for deletion).
**Action:** Replace native prompts with design system `AlertDialog` components. Extend the `AlertDialogAction` component to support the `variant` prop from the base `Button` component to ensure consistent styling of confirmation buttons.
