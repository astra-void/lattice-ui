import { React } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { Select } from "@lattice-ui/select";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");

type SelectRenderOptions = {
  open?: boolean;
  defaultOpen?: boolean;
  value?: string;
  defaultValue?: string;
  forceMount?: boolean;
  disableBeta?: boolean;
  markerText: string;
};

function renderSelectTree(options: SelectRenderOptions, playerGui: PlayerGui) {
  return (
    <PortalProvider container={playerGui}>
      <Select.Root
        defaultOpen={options.defaultOpen}
        defaultValue={options.defaultValue}
        open={options.open}
        value={options.value}
      >
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

type ControlledSelectSelectionHarnessProps = {
  commitSelection: boolean;
  playerGui: PlayerGui;
};

function ControlledSelectSelectionHarness(props: ControlledSelectSelectionHarnessProps) {
  const [open, setOpen] = React.useState(true);
  const [value, setValue] = React.useState("alpha");
  const committedRef = React.useRef(false);

  React.useEffect(() => {
    if (!props.commitSelection || committedRef.current) {
      return;
    }

    committedRef.current = true;
    setValue("beta");
    setOpen(false);
  }, [props.commitSelection]);

  return (
    <PortalProvider container={props.playerGui}>
      <Select.Root onOpenChange={setOpen} onValueChange={setValue} open={open} value={value}>
        <Select.Trigger asChild>
          <textbutton Text="select-trigger-controlled" />
        </Select.Trigger>
        <Select.Value asChild placeholder="Pick one">
          <textlabel />
        </Select.Value>

        <Select.Portal>
          <Select.Content asChild forceMount>
            <frame>
              <Select.Item asChild textValue="Alpha Option" value="alpha">
                <textbutton Text="select-item-alpha-controlled" />
              </Select.Item>
              <Select.Item asChild textValue="Beta Option" value="beta">
                <textbutton Text="select-item-beta-controlled" />
              </Select.Item>
              <textlabel Text="select-marker-controlled" />
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

    it("moves selection into the selected item when content opens", () => {
      withReactHarness("SelectOpenFocusHandoff", (harness) => {
        harness.render(
          renderSelectTree(
            {
              defaultOpen: true,
              defaultValue: "beta",
              forceMount: true,
              markerText: "select-marker-open-focus",
            },
            harness.playerGui,
          ),
        );

        waitForEffects(4);
        const betaItem = findTextButtonByText(harness.playerGui, "select-item-beta");
        assert(betaItem !== undefined, "Selected SelectItem should mount when content is open.");
        assert(
          GuiService.SelectedObject === betaItem,
          "Opening SelectContent should move selection to the selected item.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("restores trigger focus after an item selection closes the content", () => {
      withReactHarness("SelectRestoreTriggerFocus", (harness) => {
        const renderTree = (commitSelection: boolean) => (
          <ControlledSelectSelectionHarness commitSelection={commitSelection} playerGui={harness.playerGui} />
        );

        harness.render(renderTree(false));

        waitForEffects(4);
        const trigger = findTextButtonByText(harness.container, "select-trigger-controlled");
        assert(trigger !== undefined, "Select trigger should mount for focus restore coverage.");

        harness.render(renderTree(true));
        waitForEffects(4);

        const selectedValueLabel = findTextLabelByText(harness.container, "Beta Option");
        const markerAfterClose = findTextLabelByText(harness.playerGui, "select-marker-controlled");
        const markerParentAfterClose = markerAfterClose?.Parent;
        assert(selectedValueLabel !== undefined, "Selection commit should update SelectValue.");
        assert(
          markerParentAfterClose !== undefined &&
            markerParentAfterClose.IsA("GuiObject") &&
            markerParentAfterClose.Visible === false,
          "Forced SelectContent should be hidden after selection closes it.",
        );
        assert(
          GuiService.SelectedObject === trigger,
          "Closing SelectContent after selection should restore trigger focus.",
        );

        GuiService.SelectedObject = undefined;
      });
    });
  });
};
