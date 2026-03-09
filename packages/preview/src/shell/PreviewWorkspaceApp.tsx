import { previewEntries, previewImporters, previewProjectName } from "virtual:lattice-preview-registry";
import React from "react";
import type { PreviewEntryMeta } from "../source/types";
import { PreviewApp } from "./PreviewApp";

export function PreviewWorkspaceApp() {
  return (
    <PreviewApp
      entries={previewEntries}
      loadEntry={(id) => {
        const importer = previewImporters[id];
        if (!importer) {
          return Promise.reject(new Error(`No preview importer registered for \`${id}\`.`));
        }

        return importer().then((module) => ({
          meta: ("__previewEntryMeta" in module ? module.__previewEntryMeta : { diagnostics: [] }) as PreviewEntryMeta,
          module,
        }));
      }}
      projectName={previewProjectName}
    />
  );
}
