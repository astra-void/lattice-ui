import { React } from "@lattice-ui/core";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "@lattice-ui/tabs";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

export = () => {
  describe("tabs", () => {
    it("selects the first enabled trigger when defaultValue is not provided", () => {
      withReactHarness("TabsDefaultSelection", (harness) => {
        harness.render(
          <TabsRoot>
            <TabsList>
              <TabsTrigger asChild value="alpha">
                <textbutton Text="tabs-trigger-alpha-default" />
              </TabsTrigger>
              <TabsTrigger asChild value="beta">
                <textbutton Text="tabs-trigger-beta-default" />
              </TabsTrigger>
            </TabsList>
            <TabsContent asChild value="alpha">
              <textlabel Text="tabs-content-alpha-default" />
            </TabsContent>
            <TabsContent asChild value="beta">
              <textlabel Text="tabs-content-beta-default" />
            </TabsContent>
          </TabsRoot>,
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
          <TabsRoot defaultValue="beta">
            <TabsList>
              <TabsTrigger asChild value="alpha">
                <textbutton Text="tabs-trigger-alpha-fallback" />
              </TabsTrigger>
              <TabsTrigger asChild disabled={disableBeta} value="beta">
                <textbutton Text="tabs-trigger-beta-fallback" />
              </TabsTrigger>
            </TabsList>
            <TabsContent asChild value="alpha">
              <textlabel Text="tabs-content-alpha-fallback" />
            </TabsContent>
            <TabsContent asChild value="beta">
              <textlabel Text="tabs-content-beta-fallback" />
            </TabsContent>
          </TabsRoot>
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
          <TabsRoot value={value}>
            <TabsList>
              <TabsTrigger asChild value="left">
                <textbutton Text="tabs-trigger-left-controlled" />
              </TabsTrigger>
              <TabsTrigger asChild value="right">
                <textbutton Text="tabs-trigger-right-controlled" />
              </TabsTrigger>
            </TabsList>
            <TabsContent asChild value="left">
              <textlabel Text="tabs-content-left-controlled" />
            </TabsContent>
            <TabsContent asChild value="right">
              <textlabel Text="tabs-content-right-controlled" />
            </TabsContent>
          </TabsRoot>
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
  });
};
