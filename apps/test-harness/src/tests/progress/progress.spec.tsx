import { React } from "@lattice-ui/core";
import { Progress } from "@lattice-ui/progress";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function findFrameByMarker(root: Instance, markerText: string) {
  const marker = findTextLabelByText(root, markerText);
  if (!marker) {
    return undefined;
  }

  const parent = marker.Parent;
  if (!parent || !parent.IsA("Frame")) {
    return undefined;
  }

  return parent;
}

function findSpinnerFrame(root: Instance) {
  const marker = findTextLabelByText(root, "spinner-marker");
  if (!marker) {
    return undefined;
  }

  const parent = marker.Parent;
  if (!parent || !parent.IsA("Frame")) {
    return undefined;
  }

  return parent;
}

export = () => {
  describe("progress", () => {
    it("maps value to indicator ratio", () => {
      withReactHarness("ProgressRatio", (harness) => {
        harness.render(
          <Progress.Root max={100} value={25}>
            <Progress.Indicator asChild>
              <frame Size={UDim2.fromScale(1, 1)}>
                <textlabel BackgroundTransparency={1} Text="progress-indicator-marker" TextTransparency={1} />
              </frame>
            </Progress.Indicator>
          </Progress.Root>,
        );

        waitForEffects(2);
        const indicator = findFrameByMarker(harness.container, "progress-indicator-marker");
        assert(indicator !== undefined, "ProgressIndicator frame should mount.");
        assert(indicator.Size.X.Scale === 0.25, "Indicator width scale should equal value/max ratio.");
      });
    });

    it("renders spinner as visible while spinning", () => {
      withReactHarness("ProgressSpinner", (harness) => {
        harness.render(
          <Progress.Spinner asChild spinning>
            <frame>
              <textlabel BackgroundTransparency={1} Text="spinner-marker" TextTransparency={1} />
            </frame>
          </Progress.Spinner>,
        );

        waitForEffects(2);
        const spinner = findSpinnerFrame(harness.container);
        assert(spinner !== undefined, "Spinner frame should mount.");
        assert(spinner.Visible === true, "Spinner should be visible when spinning=true.");
      });
    });
  });
};
