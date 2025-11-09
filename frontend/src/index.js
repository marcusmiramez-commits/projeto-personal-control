import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import ErrorBoundary from "@/components/ErrorBoundary";

// Suppress ResizeObserver errors (common with Radix UI components)
const resizeObserverLoopErrRe = /^ResizeObserver loop completed with undelivered notifications/;
const resizeObserverErrRe = /^ResizeObserver loop limit exceeded/;

const consoleError = console.error;
console.error = (...args) => {
  const firstArg = args[0];
  if (typeof firstArg === 'string' && (resizeObserverLoopErrRe.test(firstArg) || resizeObserverErrRe.test(firstArg))) {
    return;
  }
  consoleError(...args);
};

window.addEventListener('error', (e) => {
  if (resizeObserverLoopErrRe.test(e.message) || resizeObserverErrRe.test(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
