## 2025-05-14 - Granular Loading States for List Items
**Learning:** In list views with asynchronous actions (like toggling a switch), using a global loading state causes the entire UI to feel unresponsive. Implementing a granular loading state (e.g., `Record<string, boolean>`) allows users to continue interacting with other items while one is being processed.
**Action:** Always prefer item-level loading indicators and disabled states over global overlays or full-page loaders for list interactions.

## 2025-05-15 - Semantic Inversion of Trend Indicators
**Learning:** For dashboard metrics where a numerical decrease is desirable (e.g., Recovery Time, Latency, Churn), standard green-up/red-down trend indicators are semantically incorrect and confusing.
**Action:** Implement an `inverse` or `isGood` property on status/trend components to ensure downward trends are styled as positive (emerald green) when they represent improvement.

## 2025-05-16 - Coordinated Hover Feedback for Navigation
**Learning:** Enhancing navigation links with coordinated hover effects (e.g., scaling icons while transitioning text color) provides a more responsive and "premium" feel than simple color changes alone. Using Tailwind's `group` utility ensures that the entire link area triggers the feedback, making the interaction feel cohesive.
**Action:** When styling navigation or complex interactive elements, use `group` hover states to coordinate multiple child animations, providing immediate and delightful visual confirmation of the interaction target.
