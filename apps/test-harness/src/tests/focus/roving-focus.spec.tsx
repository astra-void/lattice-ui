import { React } from "@lattice-ui/core";
import { RovingFocusGroup, RovingFocusItem } from "@lattice-ui/focus";
import { findTextButtonByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");

export = () => {
  describe("roving-focus", () => {
    it("autoFocus first selects the first selectable item", () => {
      withReactHarness("RovingFocusFirst", (harness) => {
        GuiService.SelectedObject = undefined;

        harness.render(
          <RovingFocusGroup active={true} autoFocus="first">
            <RovingFocusItem asChild>
              <textbutton Text="roving-focus-first" />
            </RovingFocusItem>
            <RovingFocusItem asChild>
              <textbutton Text="roving-focus-second" />
            </RovingFocusItem>
          </RovingFocusGroup>,
        );

        waitForEffects(3);
        const firstItem = findTextButtonByText(harness.container, "roving-focus-first");
        assert(firstItem !== undefined, "First roving focus item should be mounted.");
        assert(
          GuiService.SelectedObject === firstItem,
          "RovingFocusGroup should auto focus the first selectable item when autoFocus is first.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("skips disabled items during auto focus", () => {
      withReactHarness("RovingFocusDisabledSkip", (harness) => {
        GuiService.SelectedObject = undefined;

        harness.render(
          <RovingFocusGroup active={true} autoFocus="first">
            <RovingFocusItem asChild disabled={true}>
              <textbutton Text="roving-focus-disabled" />
            </RovingFocusItem>
            <RovingFocusItem asChild>
              <textbutton Text="roving-focus-enabled" />
            </RovingFocusItem>
          </RovingFocusGroup>,
        );

        waitForEffects(3);
        const enabledItem = findTextButtonByText(harness.container, "roving-focus-enabled");
        assert(enabledItem !== undefined, "Enabled roving focus item should be mounted.");
        assert(
          GuiService.SelectedObject === enabledItem,
          "RovingFocusGroup should skip disabled items when determining initial focus target.",
        );

        GuiService.SelectedObject = undefined;
      });
    });
  });
};
