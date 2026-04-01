import { React } from "@lattice-ui/core";
import { Tabs } from "@lattice-ui/tabs";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");

export = () => {
  describe("tabs", () => {
    it("selects the first enabled trigger when defaultValue is not provided", () => {
      withReactHarness("TabsDefaultSelection", (harness) => {
        harness.render(
          <Tabs.Root>
            <Tabs.List>
              <Tabs.Trigger asChild value="alpha">
                <textbutton Text="tabs-trigger-alpha-default" />
              </Tabs.Trigger>
              <Tabs.Trigger asChild value="beta">
                <textbutton Text="tabs-trigger-beta-default" />
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content asChild value="alpha">
              <textlabel Text="tabs-content-alpha-default" />
            </Tabs.Content>
            <Tabs.Content asChild value="beta">
              <textlabel Text="tabs-content-beta-default" />
            </Tabs.Content>
          </Tabs.Root>,
        );

        waitForEffects();
        const alphaTrigger = findTextButtonByText(harness.container, "tabs-trigger-alpha-default");
        const betaTrigger = findTextButtonByText(harness.container, "tabs-trigger-beta-default");
        const alphaContent = findTextLabelByText(harness.container, "tabs-content-alpha-default");
        const betaContent = findTextLabelByText(harness.container, "tabs-content-beta-default");
        assert(alphaTrigger !== undefined, "Alpha trigger should mount.");
        assert(betaTrigger !== undefined, "Beta trigger should mount.");
        assert(alphaContent !== undefined, "First enabled tab content should be mounted by default.");
        assert(betaContent === undefined, "Non-selected tab content should not be mounted.");
      });
    });

    it("falls back to the next enabled tab when the selected tab becomes disabled", () => {
      withReactHarness("TabsDisabledFallback", (harness) => {
        const renderTabs = (disableBeta: boolean) => (
          <Tabs.Root defaultValue="beta">
            <Tabs.List>
              <Tabs.Trigger asChild value="alpha">
                <textbutton Text="tabs-trigger-alpha-fallback" />
              </Tabs.Trigger>
              <Tabs.Trigger asChild disabled={disableBeta} value="beta">
                <textbutton Text="tabs-trigger-beta-fallback" />
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content asChild value="alpha">
              <textlabel Text="tabs-content-alpha-fallback" />
            </Tabs.Content>
            <Tabs.Content asChild value="beta">
              <textlabel Text="tabs-content-beta-fallback" />
            </Tabs.Content>
          </Tabs.Root>
        );

        harness.render(renderTabs(false));
        waitForEffects();
        const initialBeta = findTextLabelByText(harness.container, "tabs-content-beta-fallback");
        assert(initialBeta !== undefined, "Initially selected beta content should mount.");

        harness.render(renderTabs(true));
        waitForEffects(2);

        const alphaAfterDisable = findTextLabelByText(harness.container, "tabs-content-alpha-fallback");
        const betaAfterDisable = findTextLabelByText(harness.container, "tabs-content-beta-fallback");
        assert(alphaAfterDisable !== undefined, "Tabs should fall back to the next enabled value.");
        assert(betaAfterDisable === undefined, "Disabled selected tab content should unmount after fallback.");
      });
    });

    it("switches visible content when controlled value changes", () => {
      withReactHarness("TabsContentSwitch", (harness) => {
        const renderControlledTabs = (value: string) => (
          <Tabs.Root value={value}>
            <Tabs.List>
              <Tabs.Trigger asChild value="left">
                <textbutton Text="tabs-trigger-left-controlled" />
              </Tabs.Trigger>
              <Tabs.Trigger asChild value="right">
                <textbutton Text="tabs-trigger-right-controlled" />
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content asChild value="left">
              <textlabel Text="tabs-content-left-controlled" />
            </Tabs.Content>
            <Tabs.Content asChild value="right">
              <textlabel Text="tabs-content-right-controlled" />
            </Tabs.Content>
          </Tabs.Root>
        );

        harness.render(renderControlledTabs("left"));
        waitForEffects();
        assert(
          findTextLabelByText(harness.container, "tabs-content-left-controlled") !== undefined,
          "Left content should mount when value is left.",
        );
        assert(
          findTextLabelByText(harness.container, "tabs-content-right-controlled") === undefined,
          "Right content should not mount when value is left.",
        );

        harness.render(renderControlledTabs("right"));
        waitForEffects(2);
        assert(
          findTextLabelByText(harness.container, "tabs-content-left-controlled") === undefined,
          "Left content should unmount when value switches to right.",
        );
        assert(
          findTextLabelByText(harness.container, "tabs-content-right-controlled") !== undefined,
          "Right content should mount when value switches to right.",
        );
      });
    });

    it("activates the focused trigger when selection moves", () => {
      withReactHarness("TabsSelectionActivation", (harness) => {
        harness.render(
          <Tabs.Root defaultValue="left">
            <Tabs.List>
              <Tabs.Trigger asChild value="left">
                <textbutton Text="tabs-trigger-left-selection" />
              </Tabs.Trigger>
              <Tabs.Trigger asChild value="right">
                <textbutton Text="tabs-trigger-right-selection" />
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content asChild value="left">
              <textlabel Text="tabs-content-left-selection" />
            </Tabs.Content>
            <Tabs.Content asChild value="right">
              <textlabel Text="tabs-content-right-selection" />
            </Tabs.Content>
          </Tabs.Root>,
        );

        waitForEffects(3);
        const rightTrigger = findTextButtonByText(harness.container, "tabs-trigger-right-selection");
        assert(rightTrigger !== undefined, "Right trigger should mount for selection activation coverage.");

        GuiService.SelectedObject = rightTrigger;
        waitForEffects(3);

        assert(
          findTextLabelByText(harness.container, "tabs-content-right-selection") !== undefined,
          "Focused trigger should immediately activate its tab content.",
        );
        assert(
          findTextLabelByText(harness.container, "tabs-content-left-selection") === undefined,
          "Previous tab content should unmount after focused trigger activation.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("supports vertical orientation with the same focus activation behavior", () => {
      withReactHarness("TabsVerticalOrientation", (harness) => {
        harness.render(
          <Tabs.Root defaultValue="alpha" orientation="vertical">
            <Tabs.List asChild>
              <frame>
                <Tabs.Trigger asChild value="alpha">
                  <textbutton Text="tabs-trigger-alpha-vertical" />
                </Tabs.Trigger>
                <Tabs.Trigger asChild value="beta">
                  <textbutton Text="tabs-trigger-beta-vertical" />
                </Tabs.Trigger>
              </frame>
            </Tabs.List>
            <Tabs.Content asChild value="alpha">
              <textlabel Text="tabs-content-alpha-vertical" />
            </Tabs.Content>
            <Tabs.Content asChild value="beta">
              <textlabel Text="tabs-content-beta-vertical" />
            </Tabs.Content>
          </Tabs.Root>,
        );

        waitForEffects(3);
        const betaTrigger = findTextButtonByText(harness.container, "tabs-trigger-beta-vertical");
        assert(betaTrigger !== undefined, "Vertical beta trigger should mount.");

        GuiService.SelectedObject = betaTrigger;
        waitForEffects(3);

        assert(
          findTextLabelByText(harness.container, "tabs-content-beta-vertical") !== undefined,
          "Vertical tabs should activate content when focus moves to a trigger.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("keeps content mounted during exit animation and unmounts after", () => {
      withReactHarness("TabsExitAnimation", (harness) => {
        const renderControlledTabs = (value: string) => (
          <Tabs.Root value={value}>
            <Tabs.List>
              <Tabs.Trigger asChild value="left">
                <textbutton Text="tabs-trigger-left" />
              </Tabs.Trigger>
              <Tabs.Trigger asChild value="right">
                <textbutton Text="tabs-trigger-right" />
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content asChild value="left">
              <textlabel Text="tabs-content-left" />
            </Tabs.Content>
            <Tabs.Content asChild value="right">
              <textlabel Text="tabs-content-right" />
            </Tabs.Content>
          </Tabs.Root>
        );

        harness.render(renderControlledTabs("left"));
        waitForEffects(3);

        assert(
          findTextLabelByText(harness.container, "tabs-content-left") !== undefined,
          "Left content should be mounted initially.",
        );

        harness.render(renderControlledTabs("right"));
        waitForEffects(2); // React effects

        assert(
          findTextLabelByText(harness.container, "tabs-content-left") !== undefined,
          "Left content should remain mounted immediately after switch due to exit animation.",
        );

        task.wait(0.15); // wait for 0.09s exit animation
        waitForEffects(2);

        assert(
          findTextLabelByText(harness.container, "tabs-content-left") === undefined,
          "Left content should be unmounted after exit animation.",
        );
        assert(
          findTextLabelByText(harness.container, "tabs-content-right") !== undefined,
          "Right content should be mounted.",
        );
      });
    });
  });
};
