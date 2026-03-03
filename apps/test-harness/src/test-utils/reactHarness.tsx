import { ReactRoblox } from "@lattice-ui/core";
import type React from "@rbxts/react";
import { createTestContainer, getLocalPlayerGui } from "./playerGui";

export type ReactHarness = {
  playerGui: PlayerGui;
  container: Folder;
  render: (tree: React.ReactElement) => void;
  cleanup: () => void;
};

export function waitForEffects(steps = 2) {
  for (let index = 0; index < steps; index++) {
    task.wait();
  }
}

export function createReactHarness(name = "LatticeUiTestHarnessRoot"): ReactHarness {
  const playerGui = getLocalPlayerGui();
  const container = createTestContainer(name);
  const root = ReactRoblox.createRoot(container);

  return {
    playerGui,
    container,
    render: (tree) => {
      root.render(tree);
      waitForEffects();
    },
    cleanup: () => {
      root.unmount();
      waitForEffects(1);
      container.Destroy();
    },
  };
}

export function withReactHarness(name: string, callback: (harness: ReactHarness) => void) {
  const harness = createReactHarness(name);
  try {
    callback(harness);
  } finally {
    harness.cleanup();
  }
}
