
  import React from "react";
  // Polyfill React.useOptimistic for compatibility between React Router v7 and React 18
  if (!(React as any).useOptimistic) {
    (React as any).useOptimistic = function<T>(passthrough: T) {
      return [passthrough, () => {}];
    };
  }

  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  