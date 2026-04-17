import { React, useControllableState } from "@lattice-ui/core";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function hasLabel(root: Instance, text: string) {
  return findTextLabelByText(root, text) !== undefined;
}

export = () => {
  describe("use-controllable-state", () => {
    it("applies multiple updater calls cumulatively in uncontrolled mode", () => {
      withReactHarness("UseControllableStateUncontrolled", (harness) => {
        const emissions: number[] = [];

        function TestNode() {
          const [value, setValue] = useControllableState<number>({
            defaultValue: 0,
            onChange: (nextValue) => {
              emissions.push(nextValue);
            },
          });

          React.useEffect(() => {
            setValue((previous) => previous + 1);
            setValue((previous) => previous + 1);
          }, [setValue]);

          return <textlabel Text={`use-controllable-uncontrolled-${value}`} />;
        }

        harness.render(<TestNode />);
        waitForEffects(4);

        assert(
          hasLabel(harness.container, "use-controllable-uncontrolled-2"),
          "Uncontrolled updater path should use latest state and reach value 2 after two increments.",
        );
        assert(emissions.size() === 2, "Uncontrolled onChange should run for each real value transition.");
        assert(emissions[0] === 1 && emissions[1] === 2, "Uncontrolled emissions should be [1, 2].");
      });
    });

    it("computes controlled updater next value from current controlled state", () => {
      withReactHarness("UseControllableStateControlled", (harness) => {
        const emissions: number[] = [];

        function TestNode() {
          const [externalValue, setExternalValue] = React.useState(5);
          const [value, setValue] = useControllableState<number>({
            value: externalValue,
            defaultValue: 0,
            onChange: (nextValue) => {
              emissions.push(nextValue);
              setExternalValue(nextValue);
            },
          });

          React.useEffect(() => {
            setValue((previous) => previous + 3);
          }, [setValue]);

          return <textlabel Text={`use-controllable-controlled-${value}`} />;
        }

        harness.render(<TestNode />);
        waitForEffects(4);

        assert(
          hasLabel(harness.container, "use-controllable-controlled-8"),
          "Controlled updater should derive next value from current controlled state (5 -> 8).",
        );
        assert(emissions.size() === 1, "Controlled flow should emit one onChange for a single transition.");
        assert(emissions[0] === 8, "Controlled emission should match computed value 8.");
      });
    });

    it("does not emit duplicate onChange for same value updates", () => {
      withReactHarness("UseControllableStateSameValue", (harness) => {
        const emissions: number[] = [];

        function TestNode() {
          const [value, setValue] = useControllableState<number>({
            defaultValue: 0,
            onChange: (nextValue) => {
              emissions.push(nextValue);
            },
          });

          React.useEffect(() => {
            setValue(1);
            setValue(1);
          }, [setValue]);

          return <textlabel Text={`use-controllable-same-value-${value}`} />;
        }

        harness.render(<TestNode />);
        waitForEffects(4);

        assert(
          hasLabel(harness.container, "use-controllable-same-value-1"),
          "State value should be 1 after repeated same-value assignments.",
        );
        assert(emissions.size() === 1, "onChange should only fire once for repeated same-value writes.");
        assert(emissions[0] === 1, "Single emission should match transitioned value 1.");
      });
    });

    it("does not leak controlled writes into uncontrolled state across mode transitions", () => {
      withReactHarness("UseControllableStateModeTransition", (harness) => {
        const emissions: number[] = [];

        function TestNode() {
          const [phase, setPhase] = React.useState(0);
          const [externalValue, setExternalValue] = React.useState<number | undefined>(undefined);
          const [value, setValue] = useControllableState<number>({
            value: externalValue,
            defaultValue: 1,
            onChange: (nextValue) => {
              emissions.push(nextValue);
            },
          });

          React.useEffect(() => {
            if (phase === 0) {
              setExternalValue(4);
              setPhase(1);
              return;
            }

            if (phase === 1 && externalValue !== undefined) {
              setValue((previous) => previous + 1);
              setPhase(2);
              return;
            }

            if (phase === 2) {
              setExternalValue(undefined);
              setPhase(3);
            }
          }, [externalValue, phase, setValue]);

          return <textlabel Text={`use-controllable-mode-transition-${value}`} />;
        }

        harness.render(<TestNode />);
        waitForEffects(8);

        assert(
          hasLabel(harness.container, "use-controllable-mode-transition-1"),
          "Controlled transition should not write into uncontrolled inner state.",
        );
        assert(emissions.size() === 1, "Mode transition should emit one controlled change without loops.");
        assert(emissions[0] === 5, "Controlled updater should emit computed value 5 during transition.");
      });
    });
  });
};
