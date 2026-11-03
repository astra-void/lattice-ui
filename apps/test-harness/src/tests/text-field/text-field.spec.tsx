import { React } from "@lattice-ui/react-runtime";
import { TextField } from "@lattice-ui/react-text-field";
import { findFirstDescendant, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function findTextBox(root: Instance) {
  const matched = findFirstDescendant(root, (instance) => instance.IsA("TextBox"));
  if (!matched?.IsA("TextBox")) {
    return undefined;
  }

  return matched;
}

export = () => {
  describe("text-field", () => {
    it("uses defaultValue in uncontrolled mode", () => {
      withReactHarness("TextFieldUncontrolled", (harness) => {
        harness.render(
          <TextField.Root defaultValue="alpha">
            <TextField.Input />
          </TextField.Root>,
        );

        waitForEffects();
        const input = findTextBox(harness.container);
        assert(input !== undefined, "TextFieldInput should mount a TextBox by default.");
        assert(input.Text === "alpha", "Uncontrolled TextField should render defaultValue as input text.");
      });
    });

    it("updates rendered value in controlled mode", () => {
      withReactHarness("TextFieldControlled", (harness) => {
        const renderTree = (value: string) => (
          <TextField.Root value={value}>
            <TextField.Input />
          </TextField.Root>
        );

        harness.render(renderTree("left"));
        waitForEffects();
        const initialInput = findTextBox(harness.container);
        assert(initialInput !== undefined, "Controlled TextField should mount input.");
        assert(initialInput.Text === "left", "Controlled TextField should reflect initial value.");

        harness.render(renderTree("right"));
        waitForEffects(2);
        const updatedInput = findTextBox(harness.container);
        assert(updatedInput !== undefined, "Controlled TextField should keep input mounted across rerenders.");
        assert(updatedInput.Text === "right", "Controlled TextField should reflect updated value.");
      });
    });

    it("propagates disabled and readOnly to input editability", () => {
      withReactHarness("TextFieldDisabledReadOnly", (harness) => {
        harness.render(
          <TextField.Root defaultValue="disabled" disabled>
            <TextField.Input />
          </TextField.Root>,
        );

        waitForEffects();
        const disabledInput = findTextBox(harness.container);
        assert(disabledInput !== undefined, "Disabled TextField should mount input.");
        assert(disabledInput.TextEditable === false, "Disabled TextField input should not be editable.");
        assert(disabledInput.Active === false, "Disabled TextField input should not be active.");

        harness.render(
          <TextField.Root defaultValue="readonly" readOnly>
            <TextField.Input />
          </TextField.Root>,
        );

        waitForEffects(2);
        const readOnlyInput = findTextBox(harness.container);
        assert(readOnlyInput !== undefined, "ReadOnly TextField should mount input.");
        assert(readOnlyInput.TextEditable === false, "ReadOnly TextField input should not be editable.");
        assert(readOnlyInput.Active === true, "ReadOnly TextField input should remain active for focus semantics.");
      });
    });

    it("renders the consumer's message without imposing an error tone", () => {
      withReactHarness("TextFieldInvalidMessage", (harness) => {
        harness.render(
          <TextField.Root invalid>
            <TextField.Label />
            <TextField.Input />
            <TextField.Description />
            <TextField.Message Text="Required" TextColor3={Color3.fromRGB(10, 20, 30)} />
          </TextField.Root>,
        );

        waitForEffects();
        // Unstyled primitive: text and color belong to the consumer, even while invalid.
        const message = findTextLabelByText(harness.container, "Required");
        assert(message !== undefined, "TextFieldMessage should render the consumer's text.");
        assert(
          message.TextColor3 === Color3.fromRGB(10, 20, 30),
          "Invalid TextField should keep the consumer's message color.",
        );
      });
    });
  });
};
