import { React } from "@lattice-ui/core";
import { Dialog } from "@lattice-ui/dialog";
import { PortalProvider } from "@lattice-ui/layer";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");

export = () => {
  describe("dialog", () => {
    it("does not mount content when closed", () => {
      withReactHarness("DialogClosed", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root open={false}>
              <Dialog.Portal>
                <Dialog.Content>
                  <textlabel Text="dialog-closed-marker" />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>,
        );

        waitForEffects();
        const content = findTextLabelByText(harness.playerGui, "dialog-closed-marker");
        assert(content === undefined, "DialogContent should not mount when dialog is closed.");
      });
    });

    it("mounts content when defaultOpen is true", () => {
      withReactHarness("DialogDefaultOpen", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root defaultOpen={true}>
              <Dialog.Portal>
                <Dialog.Content>
                  <textlabel Text="dialog-open-marker" />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>,
        );

        waitForEffects();
        const content = findTextLabelByText(harness.playerGui, "dialog-open-marker");
        assert(content !== undefined, "DialogContent should mount when defaultOpen is true.");
      });
    });

    it("keeps content mounted when forceMount is true while closed", () => {
      withReactHarness("DialogForceMount", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root open={false}>
              <Dialog.Portal>
                <Dialog.Content forceMount={true}>
                  <textlabel Text="dialog-force-mount-marker" />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>,
        );

        waitForEffects();
        const content = findTextLabelByText(harness.playerGui, "dialog-force-mount-marker");
        assert(content !== undefined, "DialogContent should remain mounted when forceMount is true.");
      });
    });

    it("moves focus into the first selectable descendant while modal content is open", () => {
      withReactHarness("DialogFocusTrap", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root defaultOpen={true}>
              <Dialog.Portal>
                <Dialog.Content>
                  <frame>
                    <textbutton Text="dialog-focus-target" />
                  </frame>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>,
        );

        waitForEffects(4);
        const focusTarget = findTextButtonByText(harness.playerGui, "dialog-focus-target");
        assert(focusTarget !== undefined, "Dialog focus target should mount.");
        assert(
          GuiService.SelectedObject === focusTarget,
          "Open dialog content should redirect focus to the first selectable descendant.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("keeps content and overlay mounted during exit animation and unmounts after", () => {
      withReactHarness("DialogExitAnimation", (harness) => {
        const renderDialog = (open: boolean) => (
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root open={open}>
              <Dialog.Portal>
                <Dialog.Overlay>
                  <textlabel Text="dialog-overlay" />
                </Dialog.Overlay>
                <Dialog.Content>
                  <textlabel Text="dialog-content" />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>
        );

        harness.render(renderDialog(true));
        waitForEffects(4);

        assert(findTextLabelByText(harness.playerGui, "dialog-overlay") !== undefined, "Overlay should be mounted.");
        assert(findTextLabelByText(harness.playerGui, "dialog-content") !== undefined, "Content should be mounted.");

        harness.render(renderDialog(false));
        waitForEffects(2); // React effects

        assert(
          findTextLabelByText(harness.playerGui, "dialog-overlay") !== undefined,
          "Overlay should remain mounted immediately after close due to exit animation.",
        );
        assert(
          findTextLabelByText(harness.playerGui, "dialog-content") !== undefined,
          "Content should remain mounted immediately after close due to exit animation.",
        );

        task.wait(0.2); // Wait for exit animation to finish
        waitForEffects(2);

        assert(
          findTextLabelByText(harness.playerGui, "dialog-overlay") === undefined,
          "Overlay should unmount after exit animation completes.",
        );
        assert(
          findTextLabelByText(harness.playerGui, "dialog-content") === undefined,
          "Content should unmount after exit animation completes.",
        );
      });
    });
  });
};
