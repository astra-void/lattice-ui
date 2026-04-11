import { React, ReactRoblox } from "@lattice-ui/core";
import { SystemProvider } from "@lattice-ui/system";
import { createTestContainer, getLocalPlayerGui } from "./playerGui";

const GuiService = game.GetService("GuiService");

export type ReactHarness = {
  playerGui: PlayerGui;
  container: ScreenGui;
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
      root.render(<SystemProvider>{tree}</SystemProvider>);
      waitForEffects();
    },
    cleanup: () => {
      const selectedObject = GuiService.SelectedObject;
      if (selectedObject && selectedObject.IsDescendantOf(container)) {
        GuiService.SelectedObject = undefined;
      }

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
