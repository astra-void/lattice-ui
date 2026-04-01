import { React } from "@lattice-ui/core";
import { RadioGroup } from "@lattice-ui/radio-group";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");

function RadioGroupHarness(props: { orientation?: "horizontal" | "vertical" }) {
  const [value, setValue] = React.useState("alpha");

  return (
    <frame>
      <textlabel Text={`radio-value-${value}`} />
      <RadioGroup.Root onValueChange={setValue} orientation={props.orientation} value={value}>
        <RadioGroup.Item asChild value="alpha">
          <textbutton Text="radio-item-alpha" />
        </RadioGroup.Item>
        <RadioGroup.Item asChild value="beta">
          <textbutton Text="radio-item-beta" />
        </RadioGroup.Item>
        <RadioGroup.Item asChild disabled value="gamma">
          <textbutton Text="radio-item-gamma" />
        </RadioGroup.Item>
      </RadioGroup.Root>
    </frame>
  );
}

export = () => {
  describe("radio-group", () => {
    it("updates the selected value when focus moves to an item", () => {
      withReactHarness("RadioGroupSelectionActivation", (harness) => {
        harness.render(<RadioGroupHarness />);

        waitForEffects(3);
        const betaItem = findTextButtonByText(harness.container, "radio-item-beta");
        const disabledItem = findTextButtonByText(harness.container, "radio-item-gamma");
        assert(betaItem !== undefined, "Enabled radio item should mount.");
        assert(disabledItem !== undefined, "Disabled radio item should mount for selectable assertions.");
        assert(disabledItem.Selectable === false, "Disabled radio item should not be selectable.");

        GuiService.SelectedObject = betaItem;
        waitForEffects(3);

        assert(
          findTextLabelByText(harness.container, "radio-value-beta") !== undefined,
          "Moving selection to a radio item should activate its value immediately.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("accepts horizontal orientation while preserving focus-driven activation", () => {
      withReactHarness("RadioGroupHorizontalOrientation", (harness) => {
        harness.render(<RadioGroupHarness orientation="horizontal" />);

        waitForEffects(3);
        const betaItem = findTextButtonByText(harness.container, "radio-item-beta");
        assert(betaItem !== undefined, "Horizontal radio item should mount.");

        GuiService.SelectedObject = betaItem;
        waitForEffects(3);

        assert(
          findTextLabelByText(harness.container, "radio-value-beta") !== undefined,
          "Horizontal radio groups should still activate values from selection focus.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("keeps indicator mounted during exit animation and unmounts after", () => {
      withReactHarness("RadioGroupIndicatorExitAnimation", (harness) => {
        const renderRadioGroup = (value: string) => (
          <RadioGroup.Root value={value}>
            <RadioGroup.Item asChild value="alpha">
              <textbutton Text="radio-item-alpha">
                <RadioGroup.Indicator asChild>
                  <textlabel Text="indicator-alpha" />
                </RadioGroup.Indicator>
              </textbutton>
            </RadioGroup.Item>
            <RadioGroup.Item asChild value="beta">
              <textbutton Text="radio-item-beta">
                <RadioGroup.Indicator asChild>
                  <textlabel Text="indicator-beta" />
                </RadioGroup.Indicator>
              </textbutton>
            </RadioGroup.Item>
          </RadioGroup.Root>
        );

        harness.render(renderRadioGroup("alpha"));
        waitForEffects(3);

        assert(
          findTextLabelByText(harness.container, "indicator-alpha") !== undefined,
          "Indicator alpha should be mounted initially.",
        );

        harness.render(renderRadioGroup("beta"));
        waitForEffects(2); // React effects

        assert(
          findTextLabelByText(harness.container, "indicator-alpha") !== undefined,
          "Indicator alpha should remain mounted immediately after switch due to exit animation.",
        );

        task.wait(0.15); // Wait for exit animation
        waitForEffects(2);

        assert(
          findTextLabelByText(harness.container, "indicator-alpha") === undefined,
          "Indicator alpha should unmount after exit animation completes.",
        );
        assert(
          findTextLabelByText(harness.container, "indicator-beta") !== undefined,
          "Indicator beta should be mounted.",
        );
      });
    });
  });
};
