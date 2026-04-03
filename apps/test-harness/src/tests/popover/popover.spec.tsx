import { React } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { Popover } from "@lattice-ui/popover";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");

function assertWithinTolerance(actual: number, expected: number, tolerance: number, message: string) {
  assert(math.abs(actual - expected) <= tolerance, `${message} (expected ${expected}, got ${actual})`);
}

function renderPopoverTestTree(open: boolean, forceMount: boolean, markerText: string, playerGui: PlayerGui) {
  return (
    <PortalProvider container={playerGui}>
      <Popover.Root open={open}>
        <Popover.Anchor asChild>
          <frame />
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content asChild forceMount={forceMount}>
            <textlabel Text={markerText} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </PortalProvider>
  );
}

export = () => {
  describe("popover", () => {
    it("does not mount content when closed", () => {
      withReactHarness("PopoverClosed", (harness) => {
        harness.render(renderPopoverTestTree(false, false, "PopoverClosedContent", harness.playerGui));

        waitForEffects();
        const content = findTextLabelByText(harness.playerGui, "PopoverClosedContent");
        assert(content === undefined, "PopoverContent should not mount while closed without forceMount.");
      });
    });

    it("toggles forced content visibility with open state", () => {
      withReactHarness("PopoverForceMountVisibility", (harness) => {
        harness.render(renderPopoverTestTree(false, true, "PopoverForcedContent", harness.playerGui));

        waitForEffects();
        const hiddenContent = findTextLabelByText(harness.playerGui, "PopoverForcedContent");
        assert(hiddenContent !== undefined, "Forced PopoverContent should mount when closed.");
        assert(hiddenContent.Visible === false, "Forced PopoverContent should be hidden while closed.");

        harness.render(renderPopoverTestTree(true, true, "PopoverForcedContent", harness.playerGui));
        waitForEffects();

        const visibleContent = findTextLabelByText(harness.playerGui, "PopoverForcedContent");
        assert(visibleContent !== undefined, "Forced PopoverContent should remain mounted when open.");
        assert(visibleContent.Visible === true, "Forced PopoverContent should become visible when open.");
      });
    });

    it("renders open content inside the portal container", () => {
      withReactHarness("PopoverPortalContainer", (harness) => {
        harness.render(renderPopoverTestTree(true, false, "PopoverPortalContent", harness.playerGui));

        waitForEffects();
        const content = findTextLabelByText(harness.playerGui, "PopoverPortalContent");
        assert(content !== undefined, "Open PopoverContent should mount.");
        assert(content.IsDescendantOf(harness.playerGui), "PopoverContent should render inside PlayerGui via portal.");
      });
    });

    it("animates open content from the resolved popper position without an origin jump", () => {
      withReactHarness("PopoverOpenMotionPlacement", (harness) => {
        const anchorRef = React.createRef<TextButton>();
        const contentRef = React.createRef<Frame>();

        harness.render(
          <PortalProvider container={harness.playerGui}>
            <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
              <Popover.Root open={true}>
                <Popover.Anchor asChild>
                  <textbutton
                    Position={UDim2.fromOffset(160, 96)}
                    Size={UDim2.fromOffset(80, 32)}
                    Text="popover-anchor-motion"
                    ref={anchorRef}
                  />
                </Popover.Anchor>
                <Popover.Portal>
                  <Popover.Content asChild placement="bottom">
                    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(120, 64)} ref={contentRef}>
                      <textlabel Text="popover-content-motion" />
                    </frame>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </frame>
          </PortalProvider>,
        );

        waitForEffects(4);

        const anchor = anchorRef.current;
        const content = contentRef.current;
        const wrapper = content?.Parent;
        assert(anchor !== undefined, "Popover anchor should mount for motion coverage.");
        assert(content !== undefined, "Popover content should mount for motion coverage.");
        assert(
          wrapper !== undefined && wrapper.IsA("GuiObject"),
          "Popover content should render inside a positioned wrapper.",
        );
        assert(
          wrapper.AbsolutePosition.X > 0 || wrapper.AbsolutePosition.Y > 0,
          "Popover wrapper should not render at the origin while opening.",
        );
        assertWithinTolerance(
          wrapper.AbsolutePosition.X,
          anchor.AbsolutePosition.X + anchor.AbsoluteSize.X / 2,
          2,
          "Popover wrapper should stay aligned to the anchor center while opening.",
        );
        assertWithinTolerance(
          wrapper.AbsolutePosition.Y,
          anchor.AbsolutePosition.Y + anchor.AbsoluteSize.Y,
          2,
          "Popover wrapper should stay aligned below the anchor while opening.",
        );
        assert(
          content.Position.Y.Offset > 0,
          "Bottom-placed popover content should animate with a relative downward offset.",
        );

        task.wait(0.2);
        waitForEffects(2);

        assert(
          contentRef.current?.Position.Y.Offset === 0,
          "Popover content should settle back onto the resolved popper position.",
        );
      });
    });

    it("traps focus inside modal popovers", () => {
      withReactHarness("PopoverModalFocusTrap", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <frame>
              <textbutton Text="popover-outside-button" />
              <Popover.Root defaultOpen={true} modal={true}>
                <Popover.Anchor asChild>
                  <frame />
                </Popover.Anchor>
                <Popover.Portal>
                  <Popover.Content asChild>
                    <frame>
                      <textbutton Text="popover-inside-button" />
                    </frame>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </frame>
          </PortalProvider>,
        );

        waitForEffects(4);
        const outside = findTextButtonByText(harness.container, "popover-outside-button");
        const inside = findTextButtonByText(harness.playerGui, "popover-inside-button");
        assert(outside !== undefined && inside !== undefined, "Popover focus targets should mount.");

        GuiService.SelectedObject = outside;
        waitForEffects(4);

        assert(
          GuiService.SelectedObject === inside,
          "Modal popover content should redirect external selection back inside its scope.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("does not trap focus when the popover is non-modal", () => {
      withReactHarness("PopoverNonModalFocus", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <frame>
              <textbutton Text="popover-outside-button-non-modal" />
              <Popover.Root defaultOpen={true} modal={false}>
                <Popover.Anchor asChild>
                  <frame />
                </Popover.Anchor>
                <Popover.Portal>
                  <Popover.Content asChild>
                    <frame>
                      <textbutton Text="popover-inside-button-non-modal" />
                    </frame>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </frame>
          </PortalProvider>,
        );

        waitForEffects(4);
        const outside = findTextButtonByText(harness.container, "popover-outside-button-non-modal");
        assert(outside !== undefined, "Outside focus target should mount.");

        GuiService.SelectedObject = outside;
        waitForEffects(4);

        assert(
          GuiService.SelectedObject === outside,
          "Non-modal popovers should allow selection to move outside the content scope.",
        );

        GuiService.SelectedObject = undefined;
      });
    });
  });
};
