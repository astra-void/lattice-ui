import { React } from "@lattice-ui/core";
import { Dialog } from "@lattice-ui/dialog";
import { PortalProvider } from "@lattice-ui/layer";
import { type MotionConfig } from "@lattice-ui/motion";
import { isOutsidePointerEvent } from "../../../../../packages/layer/src/dismissable/events";
import { findFirstDescendant, findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");
const Workspace = game.GetService("Workspace");

function findModalBlocker(root: Instance) {
  return findFirstDescendant(
    root,
    (instance) => instance.IsA("TextButton") && instance.Modal === true && instance.TextTransparency === 1,
  );
}

function getViewportSize() {
  const camera = Workspace.CurrentCamera;
  assert(camera !== undefined, "CurrentCamera is required for viewport assertions.");
  return camera.ViewportSize;
}

function requireGuiObjectParent(instance: Instance | undefined, message: string) {
  const parent = instance?.Parent;
  assert(parent !== undefined && parent.IsA("GuiObject"), message);
  return parent as GuiObject;
}

function assertWithinTolerance(actual: number, expected: number, tolerance: number, message: string) {
  assert(math.abs(actual - expected) <= tolerance, `${message} (expected ${expected}, got ${actual})`);
}

function createPointerInput(x: number, y: number) {
  return {
    Position: new Vector3(x, y, 0),
  } as InputObject;
}

function buildSlowDialogTransition(): MotionConfig {
  return {
    entering: {
      tweenInfo: new TweenInfo(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
      initial: {
        Position: UDim2.fromOffset(0, 24),
      },
      goals: {
        Position: UDim2.fromOffset(0, 0),
      },
    },
    exiting: {
      tweenInfo: new TweenInfo(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
      goals: {
        Position: UDim2.fromOffset(0, 24),
      },
    },
  };
}

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

    it("keeps outside hit testing scoped to the dialog surface instead of the full-screen layout host", () => {
      withReactHarness("DialogOutsideHitBoundary", (harness) => {
        const panelRef = React.createRef<Frame>();

        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root defaultOpen={true}>
              <Dialog.Portal>
                <Dialog.Content>
                  <frame Position={UDim2.fromOffset(80, 64)} Size={UDim2.fromOffset(180, 120)} ref={panelRef} />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>,
        );

        waitForEffects(2);

        const panel = panelRef.current;
        assert(
          panel !== undefined,
          "Dialog panel should mount so the outside-hit boundary can be evaluated against the actual surface.",
        );

        const layoutHost = requireGuiObjectParent(
          panel,
          "Dialog panel should remain under the full-screen layout host for layout and motion.",
        );
        const outsidePoint = createPointerInput(
          panel.AbsolutePosition.X + panel.AbsoluteSize.X + 24,
          panel.AbsolutePosition.Y + 12,
        );

        assert(
          !isOutsidePointerEvent(outsidePoint, harness.playerGui, layoutHost, { layerIgnoresGuiInset: true }),
          "The full-screen layout host reproduces the regression by swallowing outside hits as inside.",
        );
        assert(
          isOutsidePointerEvent(outsidePoint, harness.playerGui, panel, { layerIgnoresGuiInset: true }),
          "The actual dialog surface should classify points outside the panel as outside interactions.",
        );
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

    it("does not keep the modal blocker mounted when forced content is closed", () => {
      withReactHarness("DialogForceMountClosedBlocker", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root open={false}>
              <Dialog.Portal>
                <Dialog.Content forceMount={true}>
                  <textlabel Text="dialog-force-mount-blocker-marker" />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>,
        );

        waitForEffects();
        assert(
          findTextLabelByText(harness.playerGui, "dialog-force-mount-blocker-marker") !== undefined,
          "Forced dialog content should still be mounted for the blocker regression.",
        );
        assert(
          findModalBlocker(harness.playerGui) === undefined,
          "Closed forced dialog content should not leave a modal blocker behind.",
        );
      });
    });

    it("keeps force-mounted dialog content rendered until the panel exit motion completes", () => {
      withReactHarness("DialogForceMountCloseMotion", (harness) => {
        const panelRef = React.createRef<Frame>();
        const overlayRef = React.createRef<TextButton>();
        const transition = buildSlowDialogTransition();

        const renderDialog = (open: boolean) => (
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root open={open}>
              <Dialog.Portal>
                <Dialog.Overlay asChild></Dialog.Overlay>
                <Dialog.Content forceMount={true} transition={transition}>
                  <frame
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(32, 32)}
                    Size={UDim2.fromOffset(80, 80)}
                    ref={panelRef}
                  />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>
        );

        harness.render(renderDialog(true));
        waitForEffects(2);
        task.wait(0.45);
        waitForEffects(2);

        const openPanel = panelRef.current;
        assert(openPanel !== undefined, "Force-mounted dialog panel should mount while open.");
        assert(openPanel.Position.Y.Offset === 32, "Force-mounted dialog panel should settle at its base position.");
        assert(
          requireGuiObjectParent(openPanel, "Force-mounted dialog panel should stay under the full-screen layout host.")
            .Visible,
          "Force-mounted dialog host should be visible while the dialog is open.",
        );

        harness.render(renderDialog(false));
        waitForEffects(2);

        const exitingPanel = panelRef.current;
        assert(
          exitingPanel !== undefined,
          "Force-mounted dialog panel should remain mounted while exit motion starts.",
        );
        assert(
          requireGuiObjectParent(
            exitingPanel,
            "Force-mounted dialog panel should stay under the layout host during exit motion.",
          ).Visible,
          "Force-mounted dialog content should remain rendered while its exit motion runs.",
        );

        task.wait(0.05);
        waitForEffects(1);

        assert(
          panelRef.current !== undefined && panelRef.current.Position.Y.Offset > 32,
          "Force-mounted dialog panel should visibly move during close motion before hiding.",
        );
        assert(
          overlayRef.current !== undefined && overlayRef.current.Position.Y.Offset === 0,
          "Overlay should remain a separate full-screen motion target during force-mounted close motion.",
        );
        assert(
          findModalBlocker(harness.playerGui) === undefined,
          "Closed force-mounted dialog content should release the modal blocker while the panel exit motion runs.",
        );

        task.wait(0.45);
        waitForEffects(2);

        const hiddenPanel = panelRef.current;
        assert(hiddenPanel !== undefined, "Force-mounted dialog panel should stay mounted after closing.");
        assert(
          !requireGuiObjectParent(hiddenPanel, "Force-mounted dialog host should still exist after close.").Visible,
          "Force-mounted dialog content should hide only after the panel exit motion completes.",
        );
        assert(
          overlayRef.current === undefined,
          "Overlay should unmount after its own exit completes during force-mounted close.",
        );
        assert(
          findModalBlocker(harness.playerGui) === undefined,
          "Closed force-mounted dialog content should not leave a modal blocker behind after exit completes.",
        );
      });
    });

    it("preserves centered scale-based layout inside dialog content", () => {
      withReactHarness("DialogCenteredScaleLayout", (harness) => {
        const panelRef = React.createRef<Frame>();

        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root defaultOpen={true}>
              <Dialog.Portal>
                <Dialog.Content>
                  <frame
                    AnchorPoint={new Vector2(0.5, 0.5)}
                    BackgroundTransparency={1}
                    Position={UDim2.fromScale(0.5, 0.5)}
                    Size={UDim2.fromOffset(200, 120)}
                    ref={panelRef}
                  />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>,
        );

        task.wait(0.2);
        waitForEffects(2);

        const panel = panelRef.current;
        assert(panel !== undefined, "Centered dialog panel should be mounted.");

        const viewportSize = getViewportSize();
        const expectedX = viewportSize.X / 2 - 100;
        const expectedY = viewportSize.Y / 2 - 60;

        assert(
          panel.AbsoluteSize.X === 200 && panel.AbsoluteSize.Y === 120,
          "Centered panel size should be preserved.",
        );
        assertWithinTolerance(
          panel.AbsolutePosition.X,
          expectedX,
          8,
          "Centered panel X position should resolve from full-screen dialog layout space.",
        );
        assertWithinTolerance(
          panel.AbsolutePosition.Y,
          expectedY,
          8,
          "Centered panel Y position should resolve from full-screen dialog layout space.",
        );
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

    it("keeps motion for a fragment-wrapped panel while keeping overlay separate", () => {
      withReactHarness("DialogFragmentMotion", (harness) => {
        const panelRef = React.createRef<Frame>();
        const overlayRef = React.createRef<TextButton>();
        const transition = buildSlowDialogTransition();

        const renderDialog = (open: boolean) => (
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root open={open}>
              <Dialog.Portal>
                <Dialog.Overlay asChild></Dialog.Overlay>
                <Dialog.Content transition={transition}>
                  <>
                    <frame
                      BackgroundTransparency={1}
                      Position={UDim2.fromOffset(40, 40)}
                      Size={UDim2.fromOffset(40, 40)}
                      ref={panelRef}
                    />
                  </>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>
        );

        harness.render(renderDialog(true));
        waitForEffects(2);

        const viewportSize = getViewportSize();
        const panel = panelRef.current;
        const overlay = overlayRef.current;
        assert(panel !== undefined, "Fragment-wrapped dialog panel should mount.");
        assert(overlay !== undefined, "Fragment-wrapped dialog overlay should mount.");

        const layoutHost = requireGuiObjectParent(
          panel,
          "Dialog panel should remain under the full-screen layout host.",
        );
        assert(layoutHost.Position.Y.Offset === 0, "Static dialog layout host should not receive content motion.");
        assertWithinTolerance(layoutHost.AbsoluteSize.X, viewportSize.X, 1, "Layout host should remain full-screen.");
        assertWithinTolerance(layoutHost.AbsoluteSize.Y, viewportSize.Y, 1, "Layout host should remain full-screen.");
        assert(
          panel.AbsoluteSize.X < viewportSize.X && panel.AbsoluteSize.Y < viewportSize.Y,
          "Dialog panel should remain a non-full-screen motion target.",
        );
        assert(panel.Position.Y.Offset > 40, "Fragment-wrapped dialog panel should receive the open motion offset.");
        assertWithinTolerance(
          overlay.AbsoluteSize.X,
          viewportSize.X,
          1,
          "Overlay should remain full-screen and separate from panel motion.",
        );
        assertWithinTolerance(
          overlay.AbsoluteSize.Y,
          viewportSize.Y,
          1,
          "Overlay should remain full-screen and separate from panel motion.",
        );
        assert(overlay.Position.Y.Offset === 0, "Overlay should not inherit dialog panel vertical motion.");

        task.wait(0.45);
        waitForEffects(2);
        assert(
          panelRef.current?.Position.Y.Offset === 40,
          "Dialog panel should settle back to its base position after enter motion.",
        );

        harness.render(renderDialog(false));
        waitForEffects(2);

        assert(
          findTextButtonByText(harness.playerGui, "dialog-overlay-marker") !== undefined,
          "Overlay should remain mounted during fragment-wrapped close motion.",
        );
        assert(panelRef.current !== undefined, "Panel should remain mounted during fragment-wrapped close motion.");

        task.wait(0.05);
        waitForEffects(1);
        assert(
          panelRef.current !== undefined && panelRef.current.Position.Y.Offset > 40,
          "Dialog panel should continue moving during close motion.",
        );
        assert(
          overlayRef.current !== undefined && overlayRef.current.Position.Y.Offset === 0,
          "Overlay should remain position-stable while the panel exits.",
        );

        task.wait(0.45);
        waitForEffects(2);
        assert(
          findTextButtonByText(harness.playerGui, "dialog-overlay-marker") === undefined,
          "Overlay should unmount after fragment-wrapped exit completes.",
        );
        assert(panelRef.current === undefined, "Fragment-wrapped panel should unmount after exit completes.");
      });
    });

    it("waits for all animated dialog children before completing exit", () => {
      withReactHarness("DialogMultiChildExit", (harness) => {
        const panelARef = React.createRef<Frame>();
        const panelBRef = React.createRef<Frame>();
        let unmountCount = 0;
        const transition = buildSlowDialogTransition();

        function ExitMarker() {
          React.useEffect(() => {
            return () => {
              unmountCount += 1;
            };
          }, []);

          return (
            <textlabel
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(8, 8)}
              Size={UDim2.fromOffset(80, 24)}
              Text="dialog-multi-exit-marker"
            />
          );
        }

        const renderDialog = (open: boolean) => (
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root open={open}>
              <Dialog.Portal>
                <Dialog.Content transition={transition}>
                  <frame
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(20, 20)}
                    Size={UDim2.fromOffset(40, 40)}
                    ref={panelARef}
                  />
                  <frame
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(80, 20)}
                    Size={UDim2.fromOffset(40, 40)}
                    ref={panelBRef}
                  />
                  <ExitMarker />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>
        );

        harness.render(renderDialog(true));
        waitForEffects(2);
        assert(
          panelARef.current !== undefined && panelBRef.current !== undefined,
          "Both animated dialog children should mount before exit.",
        );

        harness.render(renderDialog(false));
        waitForEffects(2);
        task.wait(0.05);
        waitForEffects(1);

        assert(
          panelARef.current !== undefined,
          "First animated dialog child should remain mounted while exit motion is running.",
        );
        assert(
          panelBRef.current !== undefined,
          "Second animated dialog child should remain mounted while exit motion is running.",
        );
        assert(
          findTextLabelByText(harness.playerGui, "dialog-multi-exit-marker") !== undefined,
          "Dialog content should stay mounted until the coordinated exit finishes.",
        );

        task.wait(0.45);
        waitForEffects(2);

        assert(
          panelARef.current === undefined,
          "First animated dialog child should unmount after the coordinated exit completes.",
        );
        assert(
          panelBRef.current === undefined,
          "Second animated dialog child should unmount after the coordinated exit completes.",
        );
        assert(
          findTextLabelByText(harness.playerGui, "dialog-multi-exit-marker") === undefined,
          "Dialog content should unmount after the coordinated exit completes.",
        );
        assert(unmountCount === 1, "Dialog content exit should complete exactly once for the full animated group.");
      });
    });

    it("restores focus after modal dialog content closes", () => {
      withReactHarness("DialogFocusRestore", (harness) => {
        const renderDialog = (open: boolean) => (
          <PortalProvider container={harness.playerGui}>
            <textbutton
              Active={true}
              Position={UDim2.fromOffset(12, 12)}
              Selectable={true}
              Size={UDim2.fromOffset(140, 32)}
              Text="dialog-restore-target"
            />
            <Dialog.Root open={open}>
              <Dialog.Portal>
                <Dialog.Content>
                  <frame>
                    <textbutton Active={true} Selectable={true} Text="dialog-focus-target" />
                  </frame>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>
        );

        harness.render(renderDialog(false));
        waitForEffects(2);

        const restoreTarget = findTextButtonByText(harness.playerGui, "dialog-restore-target");
        assert(restoreTarget !== undefined, "Restore target should mount before the dialog opens.");
        GuiService.SelectedObject = restoreTarget;

        harness.render(renderDialog(true));
        waitForEffects(6);

        const dialogTarget = findTextButtonByText(harness.playerGui, "dialog-focus-target");
        assert(dialogTarget !== undefined, "Dialog focus target should mount when the modal dialog opens.");
        assert(GuiService.SelectedObject === dialogTarget, "Open modal dialog should move focus into the dialog.");

        harness.render(renderDialog(false));
        waitForEffects(2);
        task.wait(0.2);
        waitForEffects(2);

        assert(
          GuiService.SelectedObject === restoreTarget,
          "Closing the modal dialog should restore focus to the previously selected target.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("plays a perceptible close motion on exit by default", () => {
      withReactHarness("DialogPerceptibleCloseMotion", (harness) => {
        const renderDialog = (open: boolean) => (
          <PortalProvider container={harness.playerGui}>
            <Dialog.Root open={open}>
              <Dialog.Portal>
                <Dialog.Content>
                  <textlabel Text="dialog-close-motion-marker" />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </PortalProvider>
        );

        harness.render(renderDialog(true));
        waitForEffects(2);
        task.wait(0.2);

        assert(
          findTextLabelByText(harness.playerGui, "dialog-close-motion-marker") !== undefined,
          "Dialog content should be mounted after opening.",
        );

        harness.render(renderDialog(false));
        waitForEffects(2);

        task.wait(0.05);
        waitForEffects(1);

        assert(
          findTextLabelByText(harness.playerGui, "dialog-close-motion-marker") !== undefined,
          "Dialog content should remain mounted while exit motion runs (close should not be instantaneous).",
        );

        task.wait(0.2);
        waitForEffects(2);

        assert(
          findTextLabelByText(harness.playerGui, "dialog-close-motion-marker") === undefined,
          "Dialog content should unmount after close motion completes.",
        );
      });
    });
  });
};
