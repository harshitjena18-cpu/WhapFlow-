## 2024-05-24 - [Enhancing Deletion UX and Accessibility]
**Learning:** Native `window.confirm` breaks the immersion of a modern React app and lacks styling consistency. Replacing it with a themed `AlertDialog` improves the "delight" factor and allows for a state-driven UI. Adding `aria-label` to icon-only buttons is a non-negotiable requirement for accessible interfaces.
**Action:** Always prefer `AlertDialog` over `window.confirm`. Ensure `AlertDialogAction` supports themed variants (like `destructive`) to maintain visual hierarchy. Always provide descriptive labels for screen readers on icon-only interactive elements.

## 2025-05-15 - [Global Search Accessibility and Shortcuts]
**Learning:** Global search inputs often lack proper accessibility labels and quick-access shortcuts, which can hinder both screen-reader users and power users. Implementing a standard `Cmd/Ctrl + K` shortcut and a visible hint improves discoverability and speed of use.
**Action:** Ensure all primary search inputs have an `id`, a corresponding `label` (even if `sr-only`), and a standardized keyboard shortcut listener. Use `<kbd>` elements to visually communicate shortcuts to users.

## 2025-05-24 - [Clipboard Feedback and Actionable Tooltips]
**Learning:** Copy-to-clipboard actions without visual feedback leave users uncertain. Using a temporary success state (e.g., swapping a "Copy" icon for a "Check" icon) provides immediate confirmation. Wrapping icon-only actions in tooltips ensures they are discoverable and accessible without cluttering the UI with text.
**Action:** Always provide a visual "success" state for clipboard actions. Ensure all icon-only buttons have descriptive tooltips that explain the action on hover/focus.

## 2025-05-24 - [Granular Clipboard State Management]
**Learning:** Using a single boolean state for multiple copy-to-clipboard buttons on a single page leads to a confusing UI where all buttons show a "copied" state simultaneously. Transitioning to an ID-based state (`copiedId`) allows for granular, independent feedback for each action, providing a much clearer and more intuitive experience.
**Action:** When a page contains multiple independent clipboard triggers (e.g., in a list or table), use an ID-based state tracker instead of a boolean to ensure feedback is scoped to the specific element the user interacted with.

## 2026-05-24 - [Password Visibility Toggles and Form Accessibility]
**Learning:** Auth forms significantly benefit from password visibility toggles, especially on mobile or for complex passwords. Using independent states for "Password" and "Confirm Password" prevents accidental disclosure and reduces friction. Ensuring these toggles use `type="button"` prevents accidental form submissions.
**Action:** Always include password visibility toggles in Auth forms. Use `aria-label` to clearly communicate the toggle state to screen readers. Ensure toggle buttons are within a `relative` container and do not interfere with the input's focus state.

## 2026-06-15 - [Character Limit Visibility and Modal Keyboard UX]
**Learning:** For inputs with strict technical constraints (like WhatsApp's 1024-character limit), a simple text counter is often overlooked. Combining it with a visual `Progress` bar provides immediate, peripheral awareness of remaining space. Additionally, modal dialogs for content creation should support `Cmd/Ctrl + Enter` shortcuts to streamline the "Compose-to-Save" flow for power users.
**Action:** Implement tri-state feedback for character limits (standard, warning at 90%, error at 100%) and supplement with a `Progress` bar. Always provide platform-aware keyboard shortcuts in primary creation modals and communicate them via `aria-keyshortcuts` and native tooltips or titles.

## 2025-05-15 - [Consistency via Standard Components]
**Learning:** In an established codebase, look for manual implementations of common UI patterns (like toggles) that bypass the design system. Replacing these with standard components (e.g., Radix-based `Switch`) automatically brings in accessibility features and visual consistency. Avoid wrapping interactive elements in extra `div`s inside `TooltipTrigger` to ensure tooltips appear on keyboard focus.
**Action:** Always check `src/components/ui/` for existing components before modifying. Prioritize replacing "bespoke" controls. When using `TooltipTrigger asChild`, pass the interactive component directly.

## 2024-05-24 - [Visual Usage Indicators and Accessible Informational Tooltips]
**Learning:** Usage metrics (e.g., limits, quotas) are more intuitive when paired with visual `Progress` indicators, providing immediate peripheral feedback on consumption. When adding tooltips to text labels for context, wrapping the trigger in a `<button type="button">` with an `aria-label` ensures the information is discoverable via keyboard and screen readers.
**Action:** Use `Progress` components for consumption-based metrics. Always ensure tooltip triggers are focusable elements if they provide essential context; use buttons for static text labels to maintain accessibility.
