import { React } from "@lattice-ui/core";
import { Select } from "@lattice-ui/select";
import { PortalProvider } from "@lattice-ui/layer";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

type SelectRenderOptions = {
  open?: boolean;
  value?: string;
  defaultValue?: string;
  forceMount?: boolean;
  disableBeta?: boolean;
  markerText: string;
};

function renderSelectTree(options: SelectRenderOptions, playerGui: PlayerGui) {
  return (
    <PortalProvider container={playerGui}>
      <Select.Root defaultValue={options.defaultValue} open={options.open} value={options.value}>
        <Select.Trigger asChild>
          <textbutton Text="select-trigger" />
        </Select.Trigger>
        <Select.Value asChild placeholder="Pick one">
          <textlabel />
        </Select.Value>

        <Select.Portal>
          <Select.Content asChild forceMount={options.forceMount === true}>
            <frame>
              <Select.Item asChild textValue="Alpha Option" value="alpha">
                <textbutton Text="select-item-alpha" />
              </Select.Item>
              <Select.Item asChild disabled={options.disableBeta === true} textValue="Beta Option" value="beta">
                <textbutton Text="select-item-beta" />
              </Select.Item>
              <textlabel Text={options.markerText} />
            </frame>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </PortalProvider>
  );
}

export = () => {
  describe("select", () => {
    it("does not mount content while closed without forceMount", () => {
      withReactHarness("SelectClosed", (harness) => {
        harness.render(
          renderSelectTree(
            {
              open: false,
              forceMount: false,
              markerText: "select-marker-closed",
            },
            harness.playerGui,
          ),
        );

        waitForEffects();
        const marker = findTextLabelByText(harness.playerGui, "select-marker-closed");
        assert(marker === undefined, "Closed SelectContent should not mount when forceMount is false.");
      });
    });

    it("keeps forced content mounted but hidden while closed", () => {
      withReactHarness("SelectForceMount", (harness) => {
        harness.render(
          renderSelectTree(
            {
              open: false,
              forceMount: true,
              markerText: "select-marker-force",
            },
            harness.playerGui,
          ),
        );

        waitForEffects();
        const marker = findTextLabelByText(harness.playerGui, "select-marker-force");
        assert(marker !== undefined, "Forced SelectContent should mount marker while closed.");

        const markerParent = marker.Parent;
        assert(markerParent !== undefined && markerParent.IsA("GuiObject"), "Marker parent should be a GuiObject.");
        assert(markerParent.Visible === false, "Forced SelectContent should be hidden while open=false.");
      });
    });

    it("renders selected item text in SelectValue", () => {
      withReactHarness("SelectValueText", (harness) => {
        harness.render(
          renderSelectTree(
            {
              open: false,
              value: "beta",
              forceMount: true,
              markerText: "select-marker-value",
            },
            harness.playerGui,
          ),
        );

        waitForEffects(3);
        const valueLabel = findTextLabelByText(harness.container, "Beta Option");
        assert(valueLabel !== undefined, "SelectValue should resolve and render selected item textValue.");
      });
    });

    it("falls back from disabled default value to first enabled item", () => {
      withReactHarness("SelectDisabledFallback", (harness) => {
        harness.render(
          renderSelectTree(
            {
              open: false,
              defaultValue: "beta",
              disableBeta: true,
              forceMount: true,
              markerText: "select-marker-fallback",
            },
            harness.playerGui,
          ),
        );

        waitForEffects(4);
        const fallbackValueLabel = findTextLabelByText(harness.container, "Alpha Option");
        assert(
          fallbackValueLabel !== undefined,
          "Select should fall back to first enabled item when default value is disabled.",
        );

        const disabledItem = findTextButtonByText(harness.playerGui, "select-item-beta");
        assert(disabledItem !== undefined, "Disabled beta item should still mount in forced content tree.");
        assert(disabledItem.Active === false, "Disabled SelectItem should not be active.");
      });
    });
  });
};
