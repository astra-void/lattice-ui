import React from "react";
import ReactDOM from "react-dom/client";
import { PreviewWorkspaceApp } from "./PreviewWorkspaceApp";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Preview root element is missing.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <PreviewWorkspaceApp />
  </React.StrictMode>,
);
