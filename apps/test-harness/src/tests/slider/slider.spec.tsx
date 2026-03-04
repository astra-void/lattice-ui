import { React } from "@lattice-ui/core";
import { Slider, SliderRange, SliderThumb, SliderTrack } from "@lattice-ui/slider";
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
    <Slider disabled={disabled} max={100} min={0} orientation={orientation} value={value}>
      <SliderTrack asChild>
        <frame
          BackgroundColor3={Color3.fromRGB(52, 59, 76)}
          BorderSizePixel={0}
          Size={orientation === "horizontal" ? UDim2.fromOffset(240, 12) : UDim2.fromOffset(12, 240)}
        >
          <SliderRange asChild>
            <frame BackgroundColor3={Color3.fromRGB(98, 153, 255)} BorderSizePixel={0}>
              <textlabel BackgroundTransparency={1} Text={rangeMarkerText} TextTransparency={1} />
            </frame>
          </SliderRange>
          <SliderThumb asChild>
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={Color3.fromRGB(241, 246, 253)}
              BorderSizePixel={0}
              Text={thumbMarkerText}
              TextTransparency={1}
            />
          </SliderThumb>
        </frame>
      </SliderTrack>
    </Slider>
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
