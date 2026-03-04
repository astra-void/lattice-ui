import { React } from "@lattice-ui/core";
import { Grid } from "@lattice-ui/system";
import { findFirstDescendant } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function findGridLayout(root: Instance) {
  const matched = findFirstDescendant(root, (instance) => instance.IsA("UIGridLayout"));
  if (!matched || !matched.IsA("UIGridLayout")) {
    return undefined;
  }

  return matched;
}

export = () => {
  describe("system/grid", () => {
    it("respects explicit column count", () => {
      withReactHarness("SystemGridColumns", (harness) => {
        harness.render(
          <Grid cellHeight={24} columns={3} columnGap={6} rowGap={8}>
            <frame LayoutOrder={1} Size={UDim2.fromOffset(1, 1)} />
            <frame LayoutOrder={2} Size={UDim2.fromOffset(1, 1)} />
            <frame LayoutOrder={3} Size={UDim2.fromOffset(1, 1)} />
          </Grid>,
        );

        waitForEffects(3);
        const layout = findGridLayout(harness.container);
        assert(layout !== undefined, "Grid should mount an UIGridLayout.");
        assert(layout.FillDirectionMaxCells === 3, "Grid should apply explicit column count to FillDirectionMaxCells.");
      });
    });
  });
};
