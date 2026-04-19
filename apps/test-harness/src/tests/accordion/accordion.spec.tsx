import { Accordion } from "@lattice-ui/accordion";
import { React } from "@lattice-ui/core";
import type { PresenceMotionConfig } from "@lattice-ui/motion";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const STATIC_TRANSITION: PresenceMotionConfig = {
  initial: {},
  reveal: { values: {} },
  exit: { values: {} },
};

const NO_EXIT_TRANSITION: PresenceMotionConfig = {
  initial: {},
  reveal: { values: {} },
};

function renderAccordion(value?: string, transition?: PresenceMotionConfig) {
  return (
    <Accordion.Root type="single" value={value}>
      <Accordion.Item value="alpha">
        <Accordion.Header>
          <Accordion.Trigger asChild>
            <textbutton Selectable={true} Text="accordion-trigger-alpha" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content asChild transition={transition}>
          <textlabel Text="accordion-content-alpha" />
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="beta">
        <Accordion.Header>
          <Accordion.Trigger asChild>
            <textbutton Selectable={true} Text="accordion-trigger-beta" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content asChild transition={transition}>
          <textlabel Text="accordion-content-beta" />
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

export = () => {
  describe("accordion", () => {
    it("keeps previous controlled content mounted while exit motion is in progress", () => {
      withReactHarness("AccordionControlledExitInProgress", (harness) => {
        harness.render(renderAccordion("alpha"));

        waitForEffects(2);
        const alpha = findTextLabelByText(harness.container, "accordion-content-alpha");
        const beta = findTextLabelByText(harness.container, "accordion-content-beta");
        assert(alpha !== undefined, "Selected item content should be mounted.");
        assert(beta === undefined, "Non-selected single item content should be unmounted.");

        harness.render(renderAccordion("beta"));
        waitForEffects(2);
        const alphaDuringExit = findTextLabelByText(harness.container, "accordion-content-alpha");
        const betaDuringExit = findTextLabelByText(harness.container, "accordion-content-beta");
        assert(
          alphaDuringExit !== undefined,
          "Previous content should remain mounted while its exit motion is running.",
        );
        assert(betaDuringExit !== undefined, "Newly selected content should mount during the previous item's exit.");
      });
    });

    it("unmounts previous controlled content after exit motion completes", () => {
      withReactHarness("AccordionControlledExitComplete", (harness) => {
        harness.render(renderAccordion("alpha"));
        waitForEffects(2);

        harness.render(renderAccordion("beta"));
        waitForEffects(2);

        task.wait(0.15);
        waitForEffects(2);

        const alphaAfter = findTextLabelByText(harness.container, "accordion-content-alpha");
        const betaAfter = findTextLabelByText(harness.container, "accordion-content-beta");
        assert(alphaAfter === undefined, "Previous content should unmount after exit motion completes.");
        assert(betaAfter !== undefined, "Newly selected content should mount.");
      });
    });

    it("unmounts previous controlled content immediately for static no-exit transitions", () => {
      withReactHarness("AccordionControlledNoExitTransition", (harness) => {
        harness.render(renderAccordion("alpha", NO_EXIT_TRANSITION));
        waitForEffects(2);

        harness.render(renderAccordion("beta", NO_EXIT_TRANSITION));
        waitForEffects(2);

        const alphaAfter = findTextLabelByText(harness.container, "accordion-content-alpha");
        const betaAfter = findTextLabelByText(harness.container, "accordion-content-beta");
        assert(alphaAfter === undefined, "Previous content should unmount immediately when no exit transition exists.");
        assert(betaAfter !== undefined, "Newly selected content should mount with static no-exit transitions.");
      });
    });

    it("forwards asChild layout props to direct content", () => {
      withReactHarness("AccordionAsChildLayoutDirect", (harness) => {
        const contentRef = React.createRef<TextLabel>();

        harness.render(
          <Accordion.Root type="single" value="alpha">
            <Accordion.Item value="alpha">
              <Accordion.Header>
                <Accordion.Trigger asChild>
                  <textbutton Selectable={true} Text="accordion-layout-trigger-direct" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content
                asChild
                Position={UDim2.fromOffset(14, 42)}
                Size={UDim2.fromOffset(236, 28)}
                transition={STATIC_TRANSITION}
              >
                <textlabel BackgroundTransparency={1} Text="accordion-layout-direct" ref={contentRef} />
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>,
        );

        waitForEffects(2);

        const content = contentRef.current;
        assert(content !== undefined, "Direct asChild accordion content should be mounted while open.");
        assert(
          content.Position.X.Offset === 14 && content.Position.Y.Offset === 42,
          "Direct asChild accordion content should preserve forwarded Position.",
        );
        assert(
          content.Size.X.Offset === 236 && content.Size.Y.Offset === 28,
          "Direct asChild accordion content should preserve forwarded Size.",
        );
      });
    });

    it("forwards asChild layout props to wrapped body content", () => {
      withReactHarness("AccordionAsChildLayoutWrapped", (harness) => {
        const wrapperRef = React.createRef<Frame>();

        harness.render(
          <Accordion.Root type="single" value="alpha">
            <Accordion.Item value="alpha">
              <Accordion.Header>
                <Accordion.Trigger asChild>
                  <textbutton Selectable={true} Text="accordion-layout-trigger-wrapped" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content
                asChild
                Position={UDim2.fromOffset(20, 46)}
                Size={UDim2.fromOffset(248, 30)}
                transition={STATIC_TRANSITION}
              >
                <frame BackgroundTransparency={1} ref={wrapperRef}>
                  <textlabel BackgroundTransparency={1} Text="accordion-layout-wrapper-label" />
                </frame>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>,
        );

        waitForEffects(2);

        const wrapper = wrapperRef.current;
        assert(wrapper !== undefined, "Wrapped asChild accordion content should be mounted while open.");
        assert(
          wrapper.Position.X.Offset === 20 && wrapper.Position.Y.Offset === 46,
          "Wrapped asChild accordion content wrapper should preserve forwarded Position and not reset to origin.",
        );
        assert(
          wrapper.Size.X.Offset === 248 && wrapper.Size.Y.Offset === 30,
          "Wrapped asChild accordion content wrapper should preserve forwarded Size.",
        );
        assert(
          findTextLabelByText(harness.container, "accordion-layout-wrapper-label") !== undefined,
          "Wrapped asChild accordion content should keep nested body content mounted.",
        );
      });
    });
  });
};
