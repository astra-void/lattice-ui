import { previewEntries, previewImporters, previewProjectName } from "virtual:lattice-preview-registry";
import React from "react";
import { PreviewApp } from "./PreviewApp";

export function PreviewWorkspaceApp() {
  return (
    <PreviewApp
      entries={previewEntries}
      loadModule={(id) => {
        const importer = previewImporters[id];
        if (!importer) {
          return Promise.reject(new Error(`No preview importer registered for \`${id}\`.`));
        }

        return importer();
      }}
      projectName={previewProjectName}
    />
  );
}
