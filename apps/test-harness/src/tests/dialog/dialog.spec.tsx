import { React } from "@lattice-ui/core";
import { Dialog } from "@lattice-ui/dialog";
import { PortalProvider } from "@lattice-ui/layer";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

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
  });
};
