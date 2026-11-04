import { React } from "@lattice-ui/react-runtime";
import { ToggleGroup } from "@lattice-ui/react-toggle-group";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");

// The primitive is unstyled, so items are found through invisible marker labels planted inside
// them rather than through anything about their appearance.
function itemMarker(value: string) {
  return `lattice-toggle-group-item-${value}`;
}

function Marker(props: { text: string }) {
  return (
    <textlabel
      BackgroundTransparency={1}
      Size={UDim2.fromOffset(0, 0)}
      Text={props.text}
      TextTransparency={1}
      Visible={false}
    />
  );
}

function findItem(root: Instance, value: string) {
  const matched = findTextLabelByText(root, itemMarker(value))?.Parent;
  return matched?.IsA("TextButton") ? matched : undefined;
}

function renderGroup(props: { disabled?: boolean; disabledItem?: string }) {
  return (
    <ToggleGroup.Root type="multiple" disabled={props.disabled} defaultValue={["b"]}>
      <frame BackgroundTransparency={1} Size={UDim2.fromOffset(300, 40)}>
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal} SortOrder={Enum.SortOrder.LayoutOrder} />
        {["a", "b", "c"].map((value, index) => (
          <ToggleGroup.Item
            disabled={props.disabledItem === value}
            key={value}
            LayoutOrder={index}
            Size={UDim2.fromOffset(80, 40)}
            value={value}
          >
            <Marker text={itemMarker(value)} />
          </ToggleGroup.Item>
        ))}
      </frame>
    </ToggleGroup.Root>
  );
}

export = () => {
  describe("toggle-group", () => {
    it("renders unstyled, selectable items", () => {
      withReactHarness("ToggleGroupItems", (harness) => {
        harness.render(renderGroup({}));
        waitForEffects(2);

        for (const value of ["a", "b", "c"]) {
          const item = findItem(harness.container, value);
          assert(item !== undefined, `Item ${value} should mount as a TextButton.`);
          assert(item.Text === "", `Item ${value} should not render the TextButton's default text.`);
          assert(item.BackgroundTransparency === 1, `Item ${value} should not render a default background.`);
          assert(item.Selectable === true, `Enabled item ${value} should be selectable.`);
          assert(item.Active === true, `Enabled item ${value} should be active.`);
        }
      });
    });

    it("disables a single item or the whole group", () => {
      withReactHarness("ToggleGroupDisabled", (harness) => {
        harness.render(renderGroup({ disabledItem: "b" }));
        waitForEffects(2);

        const disabledItem = findItem(harness.container, "b");
        const enabledItem = findItem(harness.container, "a");
        assert(disabledItem !== undefined && enabledItem !== undefined, "Items should mount.");
        assert(disabledItem.Selectable === false, "A disabled item should not be selectable.");
        assert(disabledItem.Active === false, "A disabled item should not be active.");
        assert(enabledItem.Selectable === true, "Disabling one item should leave the others selectable.");

        harness.render(renderGroup({ disabled: true }));
        waitForEffects(2);

        for (const value of ["a", "b", "c"]) {
          const item = findItem(harness.container, value);
          assert(item !== undefined && item.Selectable === false, `Item ${value} should follow a disabled group.`);
        }
      });
    });

    it("does not take native selection on mount", () => {
      withReactHarness("ToggleGroupNoNativeSelection", (harness) => {
        harness.render(renderGroup({}));
        waitForEffects(2);

        const selectedObject = GuiService.SelectedObject;
        assert(
          selectedObject === undefined || !selectedObject.IsDescendantOf(harness.container),
          "Mounting an inline toggle group should not move GuiService.SelectedObject into it.",
        );
      });
    });
  });
};
