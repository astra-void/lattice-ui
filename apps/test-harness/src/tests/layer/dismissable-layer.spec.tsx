import { React } from "@lattice-ui/core";
import { DismissableLayer, PortalProvider } from "@lattice-ui/layer";
import { isOutsidePointerEvent } from "../../../../../packages/layer/src/dismissable/events";
import { findFirstDescendant } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function findModalBlocker(root: Instance) {
  return findFirstDescendant(
    root,
    (instance) => instance.IsA("TextButton") && instance.Modal === true && instance.TextTransparency === 1,
  );
}

function createPointerInput(x: number, y: number) {
  return {
    Position: new Vector3(x, y, 0),
  } as InputObject;
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

    it("supports narrowing outside hit testing to the actual content boundary", () => {
      withReactHarness("DismissableLayerBoundary", (harness) => {
        const screenGui = new Instance("ScreenGui");
        screenGui.IgnoreGuiInset = true;
        screenGui.ResetOnSpawn = false;
        screenGui.Parent = harness.playerGui;

        const host = new Instance("Frame");
        host.BackgroundTransparency = 1;
        host.BorderSizePixel = 0;
        host.Size = UDim2.fromScale(1, 1);
        host.Parent = screenGui;

        const panel = new Instance("Frame");
        panel.BackgroundTransparency = 1;
        panel.BorderSizePixel = 0;
        panel.Position = UDim2.fromOffset(96, 72);
        panel.Size = UDim2.fromOffset(160, 96);
        panel.Parent = host;

        waitForEffects(2);

        const insidePoint = createPointerInput(
          panel.AbsolutePosition.X + panel.AbsoluteSize.X / 2,
          panel.AbsolutePosition.Y + panel.AbsoluteSize.Y / 2,
        );
        const outsidePoint = createPointerInput(
          panel.AbsolutePosition.X + panel.AbsoluteSize.X + 24,
          panel.AbsolutePosition.Y + 12,
        );

        assert(
          !isOutsidePointerEvent(outsidePoint, harness.playerGui, host, { layerIgnoresGuiInset: true }),
          "A full-screen host reproduces the regression by treating outside clicks as inside hits.",
        );
        assert(
          isOutsidePointerEvent(outsidePoint, harness.playerGui, panel, { layerIgnoresGuiInset: true }),
          "The actual dialog surface should treat points outside the panel as outside interactions.",
        );
        assert(
          !isOutsidePointerEvent(insidePoint, harness.playerGui, panel, { layerIgnoresGuiInset: true }),
          "The actual dialog surface should keep points inside the panel classified as inside interactions.",
        );

        screenGui.Destroy();
      });
    });
  });
};
