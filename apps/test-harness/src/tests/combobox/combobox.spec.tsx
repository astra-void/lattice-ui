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
  });
};
