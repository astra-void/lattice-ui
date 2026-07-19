import { React } from "@lattice-ui/react-runtime";
import { Switch } from "@lattice-ui/react-switch";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

// The primitives are unstyled, so nothing about a rendered instance is discoverable from its
// appearance any more. Each spec plants an invisible marker label inside the instance it wants to
// measure and looks the instance up through that marker, which is structural and cannot drift with
// styling decisions.
const SWITCH_ROOT_MARKER = "lattice-switch-root-marker";
const SWITCH_THUMB_MARKER = "lattice-switch-thumb-marker";
const CUSTOM_SWITCH_ROOT_MARKER = "lattice-custom-switch-root-marker";
const CUSTOM_SWITCH_THUMB_MARKER = "lattice-custom-switch-thumb-marker";

function Marker(props: { text: string }) {
  return (
    <textlabel
      BackgroundTransparency={1}
      Size={UDim2.fromOffset(0, 0)}
      Text={props.text}
      TextTransparency={1}
      Visible={false}
    />
  );
}

function findMarkedInstance(root: Instance, markerText: string) {
  return findTextLabelByText(root, markerText)?.Parent;
}

const TRACK_WIDTH = 160;
const TRACK_HEIGHT = 36;
const THUMB_WIDTH = 16;

const CUSTOM_TRACK_WIDTH = 46;
const CUSTOM_TRACK_HEIGHT = 24;
const CUSTOM_THUMB_WIDTH = 20;

function assertWithinTolerance(actual: number, expected: number, tolerance: number, message: string) {
  assert(math.abs(actual - expected) <= tolerance, `${message} (expected ${expected}, got ${actual})`);
}

function findSwitchRoot(root: Instance) {
  const matched = findMarkedInstance(root, SWITCH_ROOT_MARKER);
  if (!matched?.IsA("TextButton")) {
    return undefined;
  }

  return matched;
}

function findSwitchThumb(root: Instance) {
  const matched = findMarkedInstance(root, SWITCH_THUMB_MARKER);
  if (!matched?.IsA("Frame")) {
    return undefined;
  }

  return matched;
}

function findCustomSwitchRoot(root: Instance) {
  const matched = findMarkedInstance(root, CUSTOM_SWITCH_ROOT_MARKER);
  if (!matched?.IsA("TextButton")) {
    return undefined;
  }

  return matched;
}

function findCustomSwitchThumb(root: Instance) {
  const matched = findMarkedInstance(root, CUSTOM_SWITCH_THUMB_MARKER);
  if (!matched?.IsA("Frame")) {
    return undefined;
  }

  return matched;
}

// Sizes are supplied explicitly: the primitive no longer ships any, and the thumb needs a declared
// `Size` for its travel distance to be computable at all.
function renderSwitch(checked: boolean, disabled = false) {
  return (
    <Switch.Root checked={checked} disabled={disabled} Size={UDim2.fromOffset(TRACK_WIDTH, TRACK_HEIGHT)}>
      <Marker text={SWITCH_ROOT_MARKER} />
      <Switch.Thumb Size={UDim2.fromOffset(THUMB_WIDTH, THUMB_WIDTH)}>
        <Marker text={SWITCH_THUMB_MARKER} />
      </Switch.Thumb>
    </Switch.Root>
  );
}

function renderCustomSwitch(checked: boolean) {
  return (
    <Switch.Root asChild checked={checked}>
      <textbutton
        AutoButtonColor={false}
        BorderSizePixel={0}
        Size={UDim2.fromOffset(CUSTOM_TRACK_WIDTH, CUSTOM_TRACK_HEIGHT)}
        Text=""
      >
        <Marker text={CUSTOM_SWITCH_ROOT_MARKER} />
        <Switch.Thumb asChild>
          <frame BorderSizePixel={0} Size={UDim2.fromOffset(CUSTOM_THUMB_WIDTH, CUSTOM_THUMB_WIDTH)}>
            <Marker text={CUSTOM_SWITCH_THUMB_MARKER} />
          </frame>
        </Switch.Thumb>
      </textbutton>
    </Switch.Root>
  );
}

/**
 * The thumb travels the full track: unchecked sits flush at the leading edge, checked at the
 * trailing edge. There is no inset - the primitive contributes no padding of its own.
 */
function getThumbTargetX(root: TextButton, checked: boolean, thumbWidth: number) {
  return root.AbsolutePosition.X + (checked ? root.AbsoluteSize.X - thumbWidth : 0);
}

export = () => {
  describe("switch", () => {
    it("animates the thumb in both directions and settles on the checked state", () => {
      withReactHarness("SwitchBidirectionalMotion", (harness) => {
        harness.render(renderSwitch(false));
        waitForEffects(4);

        const root = findSwitchRoot(harness.container);
        const initialThumb = findSwitchThumb(harness.container);
        assert(root !== undefined, "Switch root should mount for motion coverage.");
        assert(initialThumb !== undefined, "Switch thumb should mount for motion coverage.");

        const uncheckedX = getThumbTargetX(root, false, THUMB_WIDTH);
        const checkedX = getThumbTargetX(root, true, THUMB_WIDTH);
        assertWithinTolerance(
          initialThumb.AbsolutePosition.X,
          uncheckedX,
          1,
          "Unchecked thumb should start at the leading edge.",
        );

        harness.render(renderSwitch(true));
        waitForEffects(2);
        task.wait(0.06);
        waitForEffects(1);

        const enteringThumb = findSwitchThumb(harness.container);
        const enteringRoot = findSwitchRoot(harness.container);
        assert(
          enteringThumb !== undefined && enteringRoot !== undefined,
          "Switch should stay mounted while animating on.",
        );
        assert(
          enteringThumb.AbsolutePosition.X > uncheckedX && enteringThumb.AbsolutePosition.X < checkedX,
          "Switch thumb should move smoothly toward the checked position while toggling on.",
        );

        task.wait(0.2);
        waitForEffects(2);

        const checkedThumb = findSwitchThumb(harness.container);
        const checkedRoot = findSwitchRoot(harness.container);
        assert(
          checkedThumb !== undefined && checkedRoot !== undefined,
          "Checked switch should remain mounted after settling.",
        );
        assertWithinTolerance(
          checkedThumb.AbsolutePosition.X,
          checkedX,
          1,
          "Checked thumb should settle at the trailing edge.",
        );

        harness.render(renderSwitch(false));
        waitForEffects(2);
        task.wait(0.05);
        waitForEffects(1);

        const exitingThumb = findSwitchThumb(harness.container);
        assert(exitingThumb !== undefined, "Switch thumb should remain mounted while animating off.");
        assert(
          exitingThumb.AbsolutePosition.X > uncheckedX && exitingThumb.AbsolutePosition.X < checkedX,
          "Switch thumb should animate back toward the unchecked position when toggled off.",
        );

        task.wait(0.2);
        waitForEffects(2);

        const finalThumb = findSwitchThumb(harness.container);
        const finalRoot = findSwitchRoot(harness.container);
        assert(
          finalThumb !== undefined && finalRoot !== undefined,
          "Unchecked switch should remain mounted after settling.",
        );
        assertWithinTolerance(
          finalThumb.AbsolutePosition.X,
          uncheckedX,
          1,
          "Unchecked thumb should settle back at the leading edge.",
        );
      });
    });

    it("converges on the final checked state after rapid toggles", () => {
      withReactHarness("SwitchRapidToggleMotion", (harness) => {
        harness.render(renderSwitch(false));
        waitForEffects(3);

        harness.render(renderSwitch(true));
        waitForEffects(1);
        task.wait(0.03);
        waitForEffects(1);

        harness.render(renderSwitch(false));
        waitForEffects(1);
        task.wait(0.03);
        waitForEffects(1);

        harness.render(renderSwitch(true));
        waitForEffects(2);
        task.wait(0.2);
        waitForEffects(2);

        const root = findSwitchRoot(harness.container);
        const thumb = findSwitchThumb(harness.container);
        assert(root !== undefined && thumb !== undefined, "Switch should remain mounted after rapid toggles.");
        assertWithinTolerance(
          thumb.AbsolutePosition.X,
          getThumbTargetX(root, true, THUMB_WIDTH),
          1,
          "Rapid toggles should converge on the final checked thumb position.",
        );
      });
    });

    it("aligns custom asChild thumb sizes with the checked edge", () => {
      withReactHarness("SwitchCustomThumbSize", (harness) => {
        harness.render(renderCustomSwitch(true));
        waitForEffects(2);
        task.wait(0.2);
        waitForEffects(2);

        const root = findCustomSwitchRoot(harness.container);
        const thumb = findCustomSwitchThumb(harness.container);
        assert(root !== undefined && thumb !== undefined, "Custom switch should mount the root and thumb.");
        assertWithinTolerance(
          thumb.AbsolutePosition.X,
          getThumbTargetX(root, true, CUSTOM_THUMB_WIDTH),
          1,
          "Custom switch thumb should align to the checked edge using its own declared width.",
        );
      });
    });

    it("keeps disabled switches stable while following controlled checked state", () => {
      withReactHarness("SwitchDisabledControlled", (harness) => {
        harness.render(renderSwitch(false, true));
        waitForEffects(4);

        const initialRoot = findSwitchRoot(harness.container);
        const initialThumb = findSwitchThumb(harness.container);
        assert(
          initialRoot !== undefined && initialThumb !== undefined,
          "Disabled switch should mount for controlled coverage.",
        );
        assert(initialRoot.Active === false, "Disabled switch should stay non-interactive.");
        assert(initialRoot.Selectable === false, "Disabled switch should stay out of native selection.");
        assertWithinTolerance(
          initialThumb.AbsolutePosition.X,
          getThumbTargetX(initialRoot, false, THUMB_WIDTH),
          1,
          "Disabled switch should still render the unchecked thumb position correctly.",
        );

        harness.render(renderSwitch(true, true));
        waitForEffects(2);
        task.wait(0.2);
        waitForEffects(2);

        const checkedRoot = findSwitchRoot(harness.container);
        const checkedThumb = findSwitchThumb(harness.container);
        assert(
          checkedRoot !== undefined && checkedThumb !== undefined,
          "Disabled controlled switch should remain mounted after external updates.",
        );
        assert(checkedRoot.Active === false, "Disabled controlled switch should remain non-interactive after updates.");
        assertWithinTolerance(
          checkedThumb.AbsolutePosition.X,
          getThumbTargetX(checkedRoot, true, THUMB_WIDTH),
          1,
          "Disabled controlled switch should still follow the external checked state.",
        );
      });
    });
  });
};
