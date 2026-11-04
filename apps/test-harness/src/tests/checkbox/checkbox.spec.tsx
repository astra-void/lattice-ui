import { Checkbox } from "@lattice-ui/react-checkbox";
import { React } from "@lattice-ui/react-runtime";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

// The primitive is unstyled, so instances are found through invisible marker labels planted
// inside them rather than through anything about their appearance.
const ROOT_MARKER = "lattice-checkbox-root-marker";
const INDICATOR_MARKER = "lattice-checkbox-indicator-marker";

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

function findRoot(root: Instance) {
  const matched = findTextLabelByText(root, ROOT_MARKER)?.Parent;
  return matched?.IsA("TextButton") ? matched : undefined;
}

function findIndicator(root: Instance) {
  const matched = findTextLabelByText(root, INDICATOR_MARKER)?.Parent;
  return matched?.IsA("Frame") ? matched : undefined;
}

function renderCheckbox(props: { checked: boolean | "indeterminate"; disabled?: boolean; forceMount?: boolean }) {
  return (
    <Checkbox.Root checked={props.checked} disabled={props.disabled} Size={UDim2.fromOffset(24, 24)}>
      <Marker text={ROOT_MARKER} />
      <Checkbox.Indicator forceMount={props.forceMount}>
        <Marker text={INDICATOR_MARKER} />
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}

export = () => {
  describe("checkbox", () => {
    it("renders an unstyled, selectable root", () => {
      withReactHarness("CheckboxRoot", (harness) => {
        harness.render(renderCheckbox({ checked: false }));
        waitForEffects(2);

        const root = findRoot(harness.container);
        assert(root !== undefined, "Checkbox root should mount as a TextButton.");
        assert(root.Text === "", "Checkbox root should not render the TextButton's default text.");
        assert(root.BackgroundTransparency === 1, "Checkbox root should not render a default background.");
        assert(root.AutoButtonColor === false, "Checkbox root should not tint itself on hover.");
        assert(root.Selectable === true, "An enabled checkbox root should be selectable.");
        assert(root.Active === true, "An enabled checkbox root should be active.");
      });
    });

    it("is neither selectable nor active while disabled", () => {
      withReactHarness("CheckboxDisabled", (harness) => {
        harness.render(renderCheckbox({ checked: false, disabled: true }));
        waitForEffects(2);

        const root = findRoot(harness.container);
        assert(root !== undefined, "Disabled checkbox root should mount.");
        assert(root.Selectable === false, "A disabled checkbox root should not be selectable.");
        assert(root.Active === false, "A disabled checkbox root should not be active.");
      });
    });

    it("mounts the indicator for checked and indeterminate and removes it when unchecked", () => {
      withReactHarness("CheckboxIndicatorPresence", (harness) => {
        harness.render(renderCheckbox({ checked: false }));
        waitForEffects(2);
        assert(findIndicator(harness.container) === undefined, "Unchecked checkbox should not mount the indicator.");

        harness.render(renderCheckbox({ checked: true }));
        waitForEffects(2);
        assert(findIndicator(harness.container) !== undefined, "Checked checkbox should mount the indicator.");

        harness.render(renderCheckbox({ checked: "indeterminate" }));
        waitForEffects(2);
        assert(findIndicator(harness.container) !== undefined, "Indeterminate checkbox should keep the indicator.");

        harness.render(renderCheckbox({ checked: false }));
        waitForEffects(4);
        assert(findIndicator(harness.container) === undefined, "Unchecking should remove the indicator.");
      });
    });

    it("keeps a force-mounted indicator and hides it while unchecked", () => {
      withReactHarness("CheckboxIndicatorForceMount", (harness) => {
        harness.render(renderCheckbox({ checked: false, forceMount: true }));
        waitForEffects(2);

        const hidden = findIndicator(harness.container);
        assert(hidden !== undefined, "A force-mounted indicator should stay mounted while unchecked.");
        assert(hidden.Visible === false, "A force-mounted indicator should be hidden while unchecked.");

        harness.render(renderCheckbox({ checked: true, forceMount: true }));
        waitForEffects(2);

        const shown = findIndicator(harness.container);
        assert(shown?.Visible, "A force-mounted indicator should show once checked.");
      });
    });
  });
};
