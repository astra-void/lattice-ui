import { React } from "@lattice-ui/core";
import { Progress } from "@lattice-ui/progress";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function approx(value: number, expected: number, epsilon = 0.0001) {
  return math.abs(value - expected) <= epsilon;
}

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

function requireGuiObjectParent(instance: Instance | undefined, message: string) {
  const parent = instance?.Parent;
  assert(parent !== undefined && parent.IsA("GuiObject"), message);
  return parent as GuiObject;
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

function renderProgress(value: number, markerText: string) {
  return (
    <Progress.Root max={100} value={value}>
      <Progress.Indicator asChild>
        <frame Size={UDim2.fromScale(1, 1)}>
          <textlabel BackgroundTransparency={1} Text={markerText} TextTransparency={1} />
        </frame>
      </Progress.Indicator>
    </Progress.Root>
  );
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
        const motionHost = requireGuiObjectParent(
          indicator,
          "ProgressIndicator should render inside the motion-owned geometry host.",
        );
        assert(indicator.Size.X.Scale === 1, "Indicator child should fill the motion-owned host.");
        assert(motionHost.Size.X.Scale === 0.25, "Indicator width scale should equal value/max ratio.");
        assert(
          math.abs(indicator.AbsoluteSize.X - motionHost.AbsoluteSize.X) <= 1,
          "ProgressIndicator should not double-apply the value ratio.",
        );
      });
    });

    it("keeps the same indicator mounted while animating determinate updates", () => {
      withReactHarness("ProgressDeterminateMotion", (harness) => {
        harness.render(renderProgress(10, "progress-indicator-motion-marker"));

        waitForEffects(2);
        task.wait(0.2);
        waitForEffects(2);

        const initialIndicator = findFrameByMarker(harness.container, "progress-indicator-motion-marker");
        assert(initialIndicator !== undefined, "Progress motion test should mount the indicator.");
        const initialMotionHost = requireGuiObjectParent(
          initialIndicator,
          "Progress motion test should render inside the motion-owned host.",
        );
        assert(approx(initialMotionHost.Size.X.Scale, 0.1), "Progress indicator should start at 10%.");

        harness.render(renderProgress(80, "progress-indicator-motion-marker"));

        waitForEffects(2);
        task.wait(0.06);
        waitForEffects(1);

        const movingIndicator = findFrameByMarker(harness.container, "progress-indicator-motion-marker");
        assert(movingIndicator !== undefined, "Progress indicator should remain mounted while animating.");
        assert(movingIndicator === initialIndicator, "Progress indicator should update on the mounted instance.");
        const movingMotionHost = requireGuiObjectParent(
          movingIndicator,
          "Progress indicator should keep the same motion-owned host while animating.",
        );
        assert(
          movingMotionHost.Size.X.Scale > 0.1 && movingMotionHost.Size.X.Scale < 0.8,
          "Progress indicator size should tween between determinate ratios instead of snapping.",
        );

        task.wait(0.4);
        waitForEffects(2);

        const settledIndicator = findFrameByMarker(harness.container, "progress-indicator-motion-marker");
        assert(settledIndicator === initialIndicator, "Progress indicator should remain mounted after settling.");
        const settledMotionHost = requireGuiObjectParent(
          settledIndicator,
          "Progress indicator should keep the motion-owned host after settling.",
        );
        assert(approx(settledMotionHost.Size.X.Scale, 0.8), "Progress indicator should settle on the final ratio.");
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
