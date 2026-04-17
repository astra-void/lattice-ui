import { Combobox } from "@lattice-ui/combobox";
import { React } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { findFirstDescendant, findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function findTextBox(root: Instance) {
  const matched = findFirstDescendant(root, (instance) => instance.IsA("TextBox"));
  if (!matched?.IsA("TextBox")) {
    return undefined;
  }

  return matched;
}

type ComboboxRenderOptions = {
  defaultInputValue?: string;
  defaultOpen?: boolean;
  defaultValue?: string;
  forceMount?: boolean;
  markerText: string;
  open?: boolean;
  value?: string;
};

function renderComboboxTree(options: ComboboxRenderOptions, playerGui: PlayerGui) {
  return (
    <PortalProvider container={playerGui}>
      <Combobox.Root
        defaultInputValue={options.defaultInputValue}
        defaultOpen={options.defaultOpen}
        defaultValue={options.defaultValue}
        open={options.open}
        value={options.value}
      >
        <Combobox.Trigger asChild>
          <textbutton Selectable={true} Text="combobox-trigger" />
        </Combobox.Trigger>
        <Combobox.Input asChild>
          <textbox />
        </Combobox.Input>
        <Combobox.Value asChild>
          <textlabel />
        </Combobox.Value>

        <Combobox.Portal>
          <Combobox.Content asChild forceMount={options.forceMount === true}>
            <frame>
              <Combobox.Item asChild textValue="Alpha Option" value="alpha">
                <textbutton Selectable={true} Text="combobox-item-alpha" />
              </Combobox.Item>
              <Combobox.Item asChild textValue="Beta Option" value="beta">
                <textbutton Selectable={true} Text="combobox-item-beta" />
              </Combobox.Item>
              <textlabel Text={options.markerText} />
            </frame>
          </Combobox.Content>
        </Combobox.Portal>
      </Combobox.Root>
    </PortalProvider>
  );
}

type ControlledComboboxSelectionHarnessProps = {
  commitSelection: boolean;
  openChanges: Array<boolean>;
  playerGui: PlayerGui;
  valueChanges: Array<string>;
};

function ControlledComboboxSelectionHarness(props: ControlledComboboxSelectionHarnessProps) {
  const [open, setOpen] = React.useState(true);
  const [value, setValue] = React.useState("alpha");
  const committedRef = React.useRef(false);

  const applyOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      props.openChanges.push(nextOpen);
      setOpen(nextOpen);
    },
    [props.openChanges],
  );

  const applyValueChange = React.useCallback(
    (nextValue: string) => {
      props.valueChanges.push(nextValue);
      setValue(nextValue);
    },
    [props.valueChanges],
  );

  React.useEffect(() => {
    if (!props.commitSelection || committedRef.current) {
      return;
    }

    committedRef.current = true;
    applyValueChange("beta");
    applyOpenChange(false);
  }, [applyOpenChange, applyValueChange, props.commitSelection]);

  return (
    <PortalProvider container={props.playerGui}>
      <Combobox.Root onOpenChange={applyOpenChange} onValueChange={applyValueChange} open={open} value={value}>
        <Combobox.Trigger asChild>
          <textbutton Selectable={true} Text="combobox-trigger-flicker" />
        </Combobox.Trigger>
        <Combobox.Input asChild>
          <textbox />
        </Combobox.Input>
        <Combobox.Value asChild>
          <textlabel />
        </Combobox.Value>

        <Combobox.Portal>
          <Combobox.Content asChild forceMount>
            <frame>
              <Combobox.Item asChild textValue="Alpha Option" value="alpha">
                <textbutton Selectable={true} Text="combobox-item-alpha-flicker" />
              </Combobox.Item>
              <Combobox.Item asChild textValue="Beta Option" value="beta">
                <textbutton Selectable={true} Text="combobox-item-beta-flicker" />
              </Combobox.Item>
              <textlabel Text="combobox-marker-flicker" />
            </frame>
          </Combobox.Content>
        </Combobox.Portal>
      </Combobox.Root>
    </PortalProvider>
  );
}

export = () => {
  describe("combobox", () => {
    it("does not enter an update loop when items mount", () => {
      withReactHarness("ComboboxMountLoop", (harness) => {
        let renderCount = 0;

        function Tracker() {
          renderCount++;
          return <textlabel Text="tracker" />;
        }

        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Combobox.Root defaultOpen={true}>
              <Combobox.Trigger asChild>
                <textbutton Selectable={true} Text="combobox-trigger" />
              </Combobox.Trigger>
              <Combobox.Input asChild>
                <textbox />
              </Combobox.Input>
              <Combobox.Portal>
                <Combobox.Content>
                  <Tracker />
                  <Combobox.Item value="a" textValue="A" />
                  <Combobox.Item value="b" textValue="B" />
                  <Combobox.Item value="c" textValue="C" />
                </Combobox.Content>
              </Combobox.Portal>
            </Combobox.Root>
          </PortalProvider>,
        );

        waitForEffects(10);
        assert(renderCount < 20, "Combobox should not re-render infinitely when items mount.");
      });
    });

    it("syncs input text from selected value while closed", () => {
      withReactHarness("ComboboxSyncInput", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Combobox.Root defaultInputValue="zzz" defaultValue="beta" open={false}>
              <Combobox.Trigger asChild>
                <textbutton Selectable={true} Text="combobox-trigger" />
              </Combobox.Trigger>
              <Combobox.Input asChild>
                <textbox />
              </Combobox.Input>
              <Combobox.Value asChild>
                <textlabel />
              </Combobox.Value>

              <Combobox.Portal>
                <Combobox.Content asChild forceMount>
                  <frame>
                    <Combobox.Item asChild textValue="Alpha Option" value="alpha">
                      <textbutton Selectable={true} Text="combobox-item-alpha-sync" />
                    </Combobox.Item>
                    <Combobox.Item asChild textValue="Beta Option" value="beta">
                      <textbutton Selectable={true} Text="combobox-item-beta-sync" />
                    </Combobox.Item>
                  </frame>
                </Combobox.Content>
              </Combobox.Portal>
            </Combobox.Root>
          </PortalProvider>,
        );

        waitForEffects(3);
        const input = findTextBox(harness.container);
        assert(input !== undefined, "ComboboxInput should mount a TextBox when asChild is used.");
        assert(input.Text === "Beta Option", "Closed combobox should force input text to selected option label.");

        const valueLabel = findTextLabelByText(harness.container, "Beta Option");
        assert(valueLabel !== undefined, "ComboboxValue should resolve selected item text.");
      });
    });

    it("mounts into portal and becomes visible when open=true", () => {
      withReactHarness("ComboboxOpenVisible", (harness) => {
        harness.render(
          renderComboboxTree(
            {
              open: true,
              forceMount: false,
              markerText: "combobox-marker-open-visible",
            },
            harness.playerGui,
          ),
        );

        waitForEffects(4);
        const marker = findTextLabelByText(harness.playerGui, "combobox-marker-open-visible");
        assert(marker !== undefined, "Combobox content should mount when open is true.");

        const contentFrame = marker.Parent;
        assert(contentFrame?.IsA("GuiObject"), "Marker parent should be a GuiObject.");
        assert(contentFrame.Visible === true, "ComboboxContent should be visible when open is true.");
      });
    });

    it("mounts content after transitioning from closed to open", () => {
      withReactHarness("ComboboxOpenTransitionVisible", (harness) => {
        harness.render(
          renderComboboxTree(
            {
              open: false,
              forceMount: false,
              markerText: "combobox-marker-transition",
            },
            harness.playerGui,
          ),
        );

        waitForEffects();
        assert(
          findTextLabelByText(harness.playerGui, "combobox-marker-transition") === undefined,
          "Closed ComboboxContent should start unmounted before the open transition.",
        );

        harness.render(
          renderComboboxTree(
            {
              open: true,
              forceMount: false,
              markerText: "combobox-marker-transition",
            },
            harness.playerGui,
          ),
        );

        waitForEffects(4);
        const marker = findTextLabelByText(harness.playerGui, "combobox-marker-transition");
        assert(marker !== undefined, "Combobox content should mount after open becomes true.");

        const contentFrame = marker.Parent;
        assert(contentFrame?.IsA("GuiObject"), "Transitioned ComboboxContent marker parent should be a GuiObject.");
        assert(contentFrame.Visible === true, "Transitioned ComboboxContent should become visible after opening.");
      });
    });

    it("hides non-matching items for current query", () => {
      withReactHarness("ComboboxFilterItems", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Combobox.Root defaultInputValue="al" defaultValue="alpha" open>
              <Combobox.Trigger asChild>
                <textbutton Selectable={true} Text="combobox-trigger-filter" />
              </Combobox.Trigger>
              <Combobox.Input asChild>
                <textbox />
              </Combobox.Input>

              <Combobox.Portal>
                <Combobox.Content asChild>
                  <frame>
                    <Combobox.Item asChild textValue="alpha" value="alpha">
                      <textbutton Selectable={true} Text="combobox-item-alpha-filter" />
                    </Combobox.Item>
                    <Combobox.Item asChild textValue="beta" value="beta">
                      <textbutton Selectable={true} Text="combobox-item-beta-filter" />
                    </Combobox.Item>
                  </frame>
                </Combobox.Content>
              </Combobox.Portal>
            </Combobox.Root>
          </PortalProvider>,
        );

        waitForEffects(3);
        const alphaButton = findTextButtonByText(harness.playerGui, "combobox-item-alpha-filter");
        const betaButton = findTextButtonByText(harness.playerGui, "combobox-item-beta-filter");
        assert(alphaButton !== undefined, "Filtered alpha item should mount.");
        assert(betaButton !== undefined, "Filtered beta item should mount for visibility checks.");
        assert(alphaButton.Visible === true, "Matching item should remain visible.");
        assert(betaButton.Visible === false, "Non-matching item should be hidden.");
      });
    });

    it("anchors content to the input when trigger and input are split", () => {
      withReactHarness("ComboboxInputAnchor", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Combobox.Root defaultValue="alpha" open>
              <frame BackgroundTransparency={1} Size={UDim2.fromOffset(420, 260)}>
                <Combobox.Trigger asChild>
                  <textbutton
                    Selectable={true}
                    Position={UDim2.fromOffset(40, 24)}
                    Size={UDim2.fromOffset(220, 32)}
                    Text="combobox-trigger-anchor"
                  />
                </Combobox.Trigger>

                <Combobox.Input asChild>
                  <textbox Position={UDim2.fromOffset(40, 132)} Size={UDim2.fromOffset(220, 36)} />
                </Combobox.Input>

                <Combobox.Portal>
                  <Combobox.Content asChild forceMount offset={new Vector2(0, 6)} placement="bottom">
                    <frame Size={UDim2.fromOffset(180, 72)}>
                      <Combobox.Item asChild textValue="alpha" value="alpha">
                        <textbutton Selectable={true} Text="combobox-item-alpha-anchor" />
                      </Combobox.Item>
                    </frame>
                  </Combobox.Content>
                </Combobox.Portal>
              </frame>
            </Combobox.Root>
          </PortalProvider>,
        );

        waitForEffects(6);

        const trigger = findTextButtonByText(harness.container, "combobox-trigger-anchor");
        const input = findTextBox(harness.container);
        const contentButton = findTextButtonByText(harness.playerGui, "combobox-item-alpha-anchor");
        const contentParent = contentButton?.Parent;
        const content = contentParent?.IsA("Frame") ? contentParent : undefined;

        assert(trigger !== undefined, "Trigger should mount for anchor regression coverage.");
        assert(input !== undefined, "Input should mount for anchor regression coverage.");
        assert(content !== undefined, "Combobox content should mount into the portal.");
        assert(
          content.AbsolutePosition.Y === input.AbsolutePosition.Y + input.AbsoluteSize.Y + 6,
          "Combobox content should anchor below the input when an input is mounted.",
        );
        assert(
          content.AbsolutePosition.Y !== trigger.AbsolutePosition.Y + trigger.AbsoluteSize.Y + 6,
          "Combobox content should no longer anchor from the trigger when an input is present.",
        );
      });
    });

    it("does not reopen after selection-driven input sync", () => {
      withReactHarness("ComboboxSelectionFlicker", (harness) => {
        const openChanges: boolean[] = [];
        const valueChanges: string[] = [];

        const renderTree = (commitSelection: boolean) => (
          <ControlledComboboxSelectionHarness
            commitSelection={commitSelection}
            openChanges={openChanges}
            playerGui={harness.playerGui}
            valueChanges={valueChanges}
          />
        );

        harness.render(renderTree(false));
        waitForEffects(3);

        const initialInput = findTextBox(harness.container);
        assert(initialInput !== undefined, "ComboboxInput should mount before selection is committed.");
        assert(openChanges.size() === 0, "Selection harness should start open without emitting open changes.");
        assert(valueChanges.size() === 0, "Selection harness should not emit value changes before selection.");

        harness.render(renderTree(true));
        waitForEffects(6);

        const input = findTextBox(harness.container);
        assert(input !== undefined, "ComboboxInput should remain mounted after selection.");
        assert(input.Text === "Beta Option", "Selection should sync the input text to the chosen item label.");

        const valueLabel = findTextLabelByText(harness.container, "Beta Option");
        assert(valueLabel !== undefined, "ComboboxValue should update to the selected item text after selection.");

        const contentButton = findTextButtonByText(harness.playerGui, "combobox-item-beta-flicker");
        const contentParent = contentButton?.Parent;
        assert(contentParent?.IsA("GuiObject"), "Forced content frame should stay mounted.");
        assert(contentParent.Visible === false, "Combobox content should stay closed after selection commits.");

        assert(valueChanges.size() === 1, "Selection should emit a single value change.");
        assert(valueChanges[0] === "beta", "Selection should emit the chosen item value.");
        assert(openChanges.size() === 1, "Selection should emit a single close event without reopening.");
        assert(openChanges[0] === false, "Selection should only close the combobox after syncing input text.");
      });
    });
  });
};
