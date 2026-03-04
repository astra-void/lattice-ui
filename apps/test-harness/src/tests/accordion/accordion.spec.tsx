import { Accordion } from "@lattice-ui/accordion";
import { React } from "@lattice-ui/core";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function renderAccordion(value?: string) {
  return (
    <Accordion.Root type="single" value={value}>
      <Accordion.Item value="alpha">
        <Accordion.Header>
          <Accordion.Trigger asChild>
            <textbutton Text="accordion-trigger-alpha" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content asChild>
          <textlabel Text="accordion-content-alpha" />
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="beta">
        <Accordion.Header>
          <Accordion.Trigger asChild>
            <textbutton Text="accordion-trigger-beta" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content asChild>
          <textlabel Text="accordion-content-beta" />
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

export = () => {
  describe("accordion", () => {
    it("shows controlled single item content", () => {
      withReactHarness("AccordionControlled", (harness) => {
        harness.render(renderAccordion("alpha"));

        waitForEffects(2);
        const alpha = findTextLabelByText(harness.container, "accordion-content-alpha");
        const beta = findTextLabelByText(harness.container, "accordion-content-beta");
        assert(alpha !== undefined, "Selected item content should be mounted.");
        assert(beta === undefined, "Non-selected single item content should be unmounted.");

        harness.render(renderAccordion("beta"));
        waitForEffects(2);
        const alphaAfter = findTextLabelByText(harness.container, "accordion-content-alpha");
        const betaAfter = findTextLabelByText(harness.container, "accordion-content-beta");
        assert(alphaAfter === undefined, "Previous content should unmount when controlled value changes.");
        assert(betaAfter !== undefined, "Newly selected content should mount.");
      });
    });
  });
};
