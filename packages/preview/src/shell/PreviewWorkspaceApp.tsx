import { previewEntryPayloads, previewImporters, previewWorkspaceIndex } from "virtual:lattice-preview-workspace-index";
import type { PreviewEngineUpdate, PreviewEntryDescriptor, PreviewEntryPayload } from "@lattice-ui/preview-engine";
import React from "react";
import { PreviewApp } from "./PreviewApp";

type HotContext = {
  off?: (event: string, callback: (update: PreviewEngineUpdate) => void) => void;
  on: (event: string, callback: (update: PreviewEngineUpdate) => void) => void;
};

function getHotContext(): HotContext | undefined {
  try {
    return Function("return import.meta.hot")() as HotContext | undefined;
  } catch {
    return undefined;
  }
}

export function PreviewWorkspaceApp() {
  const [entries, setEntries] = React.useState<PreviewEntryDescriptor[]>(() => previewWorkspaceIndex.entries);
  const [entryPayloads, setEntryPayloads] = React.useState<Record<string, PreviewEntryPayload>>(() => previewEntryPayloads);

  React.useEffect(() => {
    const hot = getHotContext();
    if (!hot) {
      return;
    }

    const handleUpdate = (update: PreviewEngineUpdate) => {
      setEntries(update.workspaceIndex.entries);
      setEntryPayloads((previousPayloads) => {
        const nextPayloads = { ...previousPayloads };
        for (const removedEntryId of update.removedEntryIds) {
          delete nextPayloads[removedEntryId];
        }
        return nextPayloads;
      });

      for (const entryId of update.changedEntryIds) {
        const importer = previewImporters[entryId];
        if (!importer) {
          continue;
        }

        void importer().then((module) => {
          const payload = ("__previewEntryPayload" in module ? module.__previewEntryPayload : undefined) as
            | PreviewEntryPayload
            | undefined;
          if (!payload) {
            return;
          }

          setEntryPayloads((previousPayloads) => ({
            ...previousPayloads,
            [entryId]: payload,
          }));
        });
      }
    };

    hot.on("lattice-preview:update", handleUpdate);
    return () => {
      hot.off?.("lattice-preview:update", handleUpdate);
    };
  }, []);

  return (
    <PreviewApp
      entries={entries}
      entryPayloads={entryPayloads}
      loadEntry={(id) => {
        const importer = previewImporters[id];
        if (!importer) {
          return Promise.reject(new Error(`No preview importer registered for \`${id}\`.`));
        }

        return importer().then((module) => {
          const payload = ("__previewEntryPayload" in module ? module.__previewEntryPayload : undefined) as
            | PreviewEntryPayload
            | undefined;

          if (payload) {
            setEntries((previousEntries) =>
              previousEntries.map((entry) => (entry.id === id ? payload.descriptor : entry)),
            );
            setEntryPayloads((previousPayloads) => ({
              ...previousPayloads,
              [id]: payload,
            }));
          }

          return {
            module,
            payload,
          };
        });
      }}
      projectName={previewWorkspaceIndex.projectName}
    />
  );
}
