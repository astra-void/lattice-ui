import { React } from "@lattice-ui/core";
import { DismissableLayer, PortalProvider } from "@lattice-ui/layer";
import { findFirstDescendant } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function findModalBlocker(root: Instance) {
  return findFirstDescendant(
    root,
    (instance) => instance.IsA("TextButton") && instance.Modal === true && instance.TextTransparency === 1,
  );
}

export = () => {
  describe("dismissable-layer", () => {
    it("renders outside-pointer blocker when modal is true", () => {
      withReactHarness("DismissableLayerModal", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <DismissableLayer enabled={true} modal={true}>
              <frame />
            </DismissableLayer>
          </PortalProvider>,
        );

        waitForEffects();
        const blocker = findModalBlocker(harness.playerGui);
        assert(blocker !== undefined, "Modal layer should render an outside-pointer blocking button.");
      });
    });

    it("does not render outside-pointer blocker when modal is false", () => {
      withReactHarness("DismissableLayerNonModal", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <DismissableLayer enabled={true} modal={false}>
              <frame />
            </DismissableLayer>
          </PortalProvider>,
        );

        waitForEffects();
        const blocker = findModalBlocker(harness.playerGui);
        assert(blocker === undefined, "Non-modal layer should not render the outside-pointer blocker.");
      });
    });

    it("does not render outside-pointer blocker when disabled even if modal", () => {
      withReactHarness("DismissableLayerDisabledModal", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <DismissableLayer enabled={false} modal={true}>
              <frame />
            </DismissableLayer>
          </PortalProvider>,
        );

        waitForEffects();
        const blocker = findModalBlocker(harness.playerGui);
        assert(blocker === undefined, "Disabled modal layer should not keep the outside-pointer blocker mounted.");
      });
    });

    it("does not render outside-pointer blocker when disabled with outside pointer events disabled", () => {
      withReactHarness("DismissableLayerDisabledOutsidePointer", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <DismissableLayer disableOutsidePointerEvents={true} enabled={false}>
              <frame />
            </DismissableLayer>
          </PortalProvider>,
        );

        waitForEffects();
        const blocker = findModalBlocker(harness.playerGui);
        assert(
          blocker === undefined,
          "Disabled layer should not keep the outside-pointer blocker mounted when outside pointer events are disabled.",
        );
      });
    });
  });
};
