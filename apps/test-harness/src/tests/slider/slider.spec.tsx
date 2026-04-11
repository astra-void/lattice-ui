import { React } from "@lattice-ui/core";
import { Slider } from "@lattice-ui/slider";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function approx(value: number, expected: number, epsilon = 0.0001) {
  return math.abs(value - expected) <= epsilon;
}

function findRangeFrame(root: Instance, markerText: string) {
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

function renderSlider(
  orientation: "horizontal" | "vertical",
  value: number,
  rangeMarkerText: string,
  thumbMarkerText: string,
  disabled = false,
) {
  return (
    <Slider.Root disabled={disabled} max={100} min={0} orientation={orientation} value={value}>
      <Slider.Track asChild>
        <frame
          BackgroundColor3={Color3.fromRGB(52, 59, 76)}
          BorderSizePixel={0}
          Size={orientation === "horizontal" ? UDim2.fromOffset(240, 12) : UDim2.fromOffset(12, 240)}
        >
          <Slider.Range asChild>
            <frame BackgroundColor3={Color3.fromRGB(98, 153, 255)} BorderSizePixel={0}>
              <textlabel BackgroundTransparency={1} Text={rangeMarkerText} TextTransparency={1} />
            </frame>
          </Slider.Range>
          <Slider.Thumb asChild>
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={Color3.fromRGB(241, 246, 253)}
              BorderSizePixel={0}
              Selectable={true}
              Text={thumbMarkerText}
              TextTransparency={1}
            />
          </Slider.Thumb>
        </frame>
      </Slider.Track>
    </Slider.Root>
  );
}

export = () => {
  describe("slider", () => {
    it("maps horizontal value to range width and thumb position", () => {
      withReactHarness("SliderHorizontal", (harness) => {
        harness.render(renderSlider("horizontal", 50, "slider-range-h", "slider-thumb-h"));

        waitForEffects(2);
        const rangeFrame = findRangeFrame(harness.container, "slider-range-h");
        const thumb = findTextButtonByText(harness.container, "slider-thumb-h");
        assert(rangeFrame !== undefined, "SliderRange frame should mount in horizontal slider.");
        assert(thumb !== undefined, "SliderThumb should mount in horizontal slider.");
        assert(
          approx(rangeFrame.Size.X.Scale, 0.5),
          "Horizontal slider range should represent 50% width for value=50.",
        );
        assert(approx(thumb.Position.X.Scale, 0.5), "Horizontal slider thumb should be positioned at 50%.");
      });
    });

    it("keeps the same horizontal thumb and range mounted while syncing repeated controlled updates", () => {
      withReactHarness("SliderHorizontalControlledMotion", (harness) => {
        harness.render(renderSlider("horizontal", 10, "slider-range-h-sync", "slider-thumb-h-sync"));

        waitForEffects(2);
        task.wait(0.2);
        waitForEffects(2);

        const initialRange = findRangeFrame(harness.container, "slider-range-h-sync");
        const initialThumb = findTextButtonByText(harness.container, "slider-thumb-h-sync");
        assert(initialRange !== undefined, "Horizontal sync test should mount the range.");
        assert(initialThumb !== undefined, "Horizontal sync test should mount the thumb.");
        assert(approx(initialRange.Size.X.Scale, 0.1), "Horizontal slider range should start at 10% width.");
        assert(approx(initialThumb.Position.X.Scale, 0.1), "Horizontal slider thumb should start at 10%.");

        harness.render(renderSlider("horizontal", 85, "slider-range-h-sync", "slider-thumb-h-sync"));

        waitForEffects(2);
        task.wait(0.2);
        waitForEffects(2);

        const updatedRange = findRangeFrame(harness.container, "slider-range-h-sync");
        const updatedThumb = findTextButtonByText(harness.container, "slider-thumb-h-sync");
        assert(updatedRange !== undefined, "Horizontal sync test should keep the range mounted after rerender.");
        assert(updatedThumb !== undefined, "Horizontal sync test should keep the thumb mounted after rerender.");
        assert(updatedRange === initialRange, "Horizontal slider range should update on the mounted instance.");
        assert(updatedThumb === initialThumb, "Horizontal slider thumb should update on the mounted instance.");
        assert(
          approx(updatedRange.Size.X.Scale, 0.85),
          "Horizontal slider range should follow repeated controlled updates.",
        );
        assert(
          approx(updatedThumb.Position.X.Scale, 0.85),
          "Horizontal slider thumb should follow repeated controlled updates.",
        );
      });
    });

    it("maps vertical value to range and thumb from bottom to top", () => {
      withReactHarness("SliderVertical", (harness) => {
        harness.render(renderSlider("vertical", 25, "slider-range-v", "slider-thumb-v"));

        waitForEffects(2);
        const rangeFrame = findRangeFrame(harness.container, "slider-range-v");
        const thumb = findTextButtonByText(harness.container, "slider-thumb-v");
        assert(rangeFrame !== undefined, "SliderRange frame should mount in vertical slider.");
        assert(thumb !== undefined, "SliderThumb should mount in vertical slider.");
        assert(
          approx(rangeFrame.Size.Y.Scale, 0.25),
          "Vertical slider range should represent 25% height for value=25.",
        );
        assert(
          approx(rangeFrame.Position.Y.Scale, 0.75),
          "Vertical slider range should start at 75% (fill from bottom).",
        );
        assert(approx(thumb.Position.Y.Scale, 0.75), "Vertical slider thumb should be positioned at 75% for value=25.");
      });
    });

    it("keeps the same vertical thumb and range mounted while syncing repeated controlled updates", () => {
      withReactHarness("SliderVerticalControlledMotion", (harness) => {
        harness.render(renderSlider("vertical", 20, "slider-range-v-sync", "slider-thumb-v-sync"));

        waitForEffects(2);
        task.wait(0.2);
        waitForEffects(2);

        const initialRange = findRangeFrame(harness.container, "slider-range-v-sync");
        const initialThumb = findTextButtonByText(harness.container, "slider-thumb-v-sync");
        assert(initialRange !== undefined, "Vertical sync test should mount the range.");
        assert(initialThumb !== undefined, "Vertical sync test should mount the thumb.");
        assert(approx(initialRange.Size.Y.Scale, 0.2), "Vertical slider range should start at 20% height.");
        assert(
          approx(initialRange.Position.Y.Scale, 0.8),
          "Vertical slider range should start at the 20% value offset.",
        );
        assert(
          approx(initialThumb.Position.Y.Scale, 0.8),
          "Vertical slider thumb should start at the 20% value offset.",
        );

        harness.render(renderSlider("vertical", 70, "slider-range-v-sync", "slider-thumb-v-sync"));

        waitForEffects(2);
        task.wait(0.2);
        waitForEffects(2);

        const updatedRange = findRangeFrame(harness.container, "slider-range-v-sync");
        const updatedThumb = findTextButtonByText(harness.container, "slider-thumb-v-sync");
        assert(updatedRange !== undefined, "Vertical sync test should keep the range mounted after rerender.");
        assert(updatedThumb !== undefined, "Vertical sync test should keep the thumb mounted after rerender.");
        assert(updatedRange === initialRange, "Vertical slider range should update on the mounted instance.");
        assert(updatedThumb === initialThumb, "Vertical slider thumb should update on the mounted instance.");
        assert(
          approx(updatedRange.Size.Y.Scale, 0.7),
          "Vertical slider range should follow repeated controlled updates.",
        );
        assert(
          approx(updatedRange.Position.Y.Scale, 0.3),
          "Vertical slider range should keep filling from the bottom.",
        );
        assert(
          approx(updatedThumb.Position.Y.Scale, 0.3),
          "Vertical slider thumb should follow repeated controlled updates.",
        );
      });
    });

    it("clamps out-of-range values and disables interaction when disabled", () => {
      withReactHarness("SliderClampDisabled", (harness) => {
        harness.render(renderSlider("horizontal", 170, "slider-range-clamp", "slider-thumb-clamp", true));

        waitForEffects(2);
        const rangeFrame = findRangeFrame(harness.container, "slider-range-clamp");
        const thumb = findTextButtonByText(harness.container, "slider-thumb-clamp");
        assert(rangeFrame !== undefined, "Clamped slider range should mount.");
        assert(thumb !== undefined, "Clamped slider thumb should mount.");
        assert(approx(rangeFrame.Size.X.Scale, 1), "Slider range should clamp to 100% for value above max.");
        assert(approx(thumb.Position.X.Scale, 1), "Slider thumb should clamp to the max endpoint.");
        assert(thumb.Active === false, "Disabled slider thumb should not be active.");
      });
    });
  });
};
