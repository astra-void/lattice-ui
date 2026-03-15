import { Combobox } from "@lattice-ui/combobox";
import { React } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { findFirstDescendant, findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function findTextBox(root: Instance) {
  const matched = findFirstDescendant(root, (instance) => instance.IsA("TextBox"));
  if (!matched || !matched.IsA("TextBox")) {
    return undefined;
  }

  return matched;
}

export = () => {
  describe("combobox", () => {
    it("syncs input text from selected value while closed", () => {
      withReactHarness("ComboboxSyncInput", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Combobox.Root defaultInputValue="zzz" defaultValue="beta" open={false}>
              <Combobox.Trigger asChild>
                <textbutton Text="combobox-trigger" />
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
                      <textbutton Text="combobox-item-alpha-sync" />
                    </Combobox.Item>
                    <Combobox.Item asChild textValue="Beta Option" value="beta">
                      <textbutton Text="combobox-item-beta-sync" />
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

    it("hides non-matching items for current query", () => {
      withReactHarness("ComboboxFilterItems", (harness) => {
        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Combobox.Root defaultInputValue="al" defaultValue="alpha" open>
              <Combobox.Trigger asChild>
                <textbutton Text="combobox-trigger-filter" />
              </Combobox.Trigger>
              <Combobox.Input asChild>
                <textbox />
              </Combobox.Input>

              <Combobox.Portal>
                <Combobox.Content asChild>
                  <frame>
                    <Combobox.Item asChild textValue="alpha" value="alpha">
                      <textbutton Text="combobox-item-alpha-filter" />
                    </Combobox.Item>
                    <Combobox.Item asChild textValue="beta" value="beta">
                      <textbutton Text="combobox-item-beta-filter" />
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
                        <textbutton Text="combobox-item-alpha-anchor" />
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
        const content = contentParent && contentParent.IsA("Frame") ? contentParent : undefined;

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
  });
};
