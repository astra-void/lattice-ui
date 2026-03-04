import { React } from "@lattice-ui/core";
import { Textarea } from "@lattice-ui/textarea";
import { findFirstDescendant } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function findTextBox(root: Instance) {
  const matched = findFirstDescendant(root, (instance) => instance.IsA("TextBox"));
  if (!matched || !matched.IsA("TextBox")) {
    return undefined;
  }

  return matched;
}

export = () => {
  describe("textarea", () => {
    it("renders multiline textbox with default value", () => {
      withReactHarness("TextareaMultiline", (harness) => {
        harness.render(
          <Textarea.Root defaultValue="line 1\nline 2">
            <Textarea.Input />
          </Textarea.Root>,
        );

        waitForEffects(2);
        const input = findTextBox(harness.container);
        assert(input !== undefined, "TextareaInput should mount a TextBox.");
        assert(input.MultiLine === true, "TextareaInput should enforce multiline mode.");
        assert(input.Text === "line 1\nline 2", "Textarea should render default value.");
      });
    });

    it("propagates disabled/readOnly editability state", () => {
      withReactHarness("TextareaDisabledReadOnly", (harness) => {
        harness.render(
          <Textarea.Root defaultValue="disabled" disabled>
            <Textarea.Input />
          </Textarea.Root>,
        );

        waitForEffects();
        const disabledInput = findTextBox(harness.container);
        assert(disabledInput !== undefined, "Disabled textarea should mount.");
        assert(disabledInput.TextEditable === false, "Disabled textarea must be non-editable.");

        harness.render(
          <Textarea.Root defaultValue="readonly" readOnly>
            <Textarea.Input />
          </Textarea.Root>,
        );

        waitForEffects(2);
        const readOnlyInput = findTextBox(harness.container);
        assert(readOnlyInput !== undefined, "ReadOnly textarea should mount.");
        assert(readOnlyInput.TextEditable === false, "ReadOnly textarea must be non-editable.");
      });
    });
  });
};
