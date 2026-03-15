import { React } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { Tooltip } from "@lattice-ui/tooltip";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");

export = () => {
  describe("tooltip", () => {
    it("opens and closes from selection focus on the trigger", () => {
      withReactHarness("TooltipSelectionFocus", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <frame>
              <textbutton Text="tooltip-outside" />
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <textbutton Text="tooltip-trigger" />
                </Tooltip.Trigger>

                <Tooltip.Portal>
                  <Tooltip.Content asChild forceMount>
                    <frame>
                      <textlabel Text="tooltip-marker" />
                    </frame>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </frame>
          </PortalProvider>,
        );

        waitForEffects(3);
        const trigger = findTextButtonByText(harness.container, "tooltip-trigger");
        const outside = findTextButtonByText(harness.container, "tooltip-outside");
        assert(trigger !== undefined, "Tooltip trigger should mount.");
        assert(outside !== undefined, "Outside button should mount.");

        GuiService.SelectedObject = trigger;
        waitForEffects(4);

        const markerWhileOpen = findTextLabelByText(harness.playerGui, "tooltip-marker");
        const markerParentWhileOpen = markerWhileOpen?.Parent;
        assert(markerWhileOpen !== undefined, "Forced tooltip content should mount its marker.");
        assert(
          markerParentWhileOpen !== undefined &&
            markerParentWhileOpen.IsA("GuiObject") &&
            markerParentWhileOpen.Visible === true,
          "Selection focus on the trigger should make tooltip content visible.",
        );

        GuiService.SelectedObject = outside;
        waitForEffects(4);

        const markerAfterBlur = findTextLabelByText(harness.playerGui, "tooltip-marker");
        const markerParentAfterBlur = markerAfterBlur?.Parent;
        assert(
          markerParentAfterBlur !== undefined &&
            markerParentAfterBlur.IsA("GuiObject") &&
            markerParentAfterBlur.Visible === false,
          "Moving selection away from the trigger should hide forced tooltip content.",
        );

        GuiService.SelectedObject = undefined;
      });
    });
  });
};
