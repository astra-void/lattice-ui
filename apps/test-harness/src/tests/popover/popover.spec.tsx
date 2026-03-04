import { React } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { Popover } from "@lattice-ui/popover";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

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
  });
};
