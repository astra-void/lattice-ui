import { React } from "@lattice-ui/core";
import { Switch } from "@lattice-ui/switch";
import { findFirstDescendant } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const TRACK_ON_COLOR = Color3.fromRGB(86, 141, 255);
const TRACK_OFF_COLOR = Color3.fromRGB(66, 73, 91);
const DISABLED_TRACK_COLOR = Color3.fromRGB(103, 110, 128);
const CUSTOM_TRACK_COLOR = Color3.fromRGB(42, 48, 62);
const CUSTOM_TRACK_ON_COLOR = Color3.fromRGB(116, 176, 95);
const CUSTOM_TRACK_OFF_COLOR = Color3.fromRGB(84, 92, 112);
const CUSTOM_DISABLED_TRACK_COLOR = Color3.fromRGB(122, 127, 140);

function assertWithinTolerance(actual: number, expected: number, tolerance: number, message: string) {
  assert(math.abs(actual - expected) <= tolerance, `${message} (expected ${expected}, got ${actual})`);
}

function findSwitchRoot(root: Instance) {
  const matched = findFirstDescendant(
    root,
    (instance) => instance.IsA("TextButton") && instance.AbsoluteSize.X === 160 && instance.AbsoluteSize.Y === 36,
  );
  if (!matched?.IsA("TextButton")) {
    return undefined;
  }

  return matched;
}

function findSwitchThumb(root: Instance) {
  const matched = findFirstDescendant(
    root,
    (instance) => instance.IsA("Frame") && instance.AbsoluteSize.X === 16 && instance.AbsoluteSize.Y === 16,
  );
  if (!matched?.IsA("Frame")) {
    return undefined;
  }

  return matched;
}

function findCustomSwitchRoot(root: Instance) {
  const matched = findFirstDescendant(
    root,
    (instance) => instance.IsA("TextButton") && instance.AbsoluteSize.X === 46 && instance.AbsoluteSize.Y === 24,
  );
  if (!matched?.IsA("TextButton")) {
    return undefined;
  }

  return matched;
}

function findCustomSwitchThumb(root: Instance) {
  const marker = findFirstDescendant(
    root,
    (instance) => instance.IsA("TextLabel") && instance.Text === "custom-switch-thumb-marker",
  );
  const parent = marker?.Parent;
  if (!parent?.IsA("Frame")) {
    return undefined;
  }

  return parent;
}

function renderSwitch(checked: boolean, disabled = false) {
  return (
    <Switch.Root checked={checked} disabled={disabled}>
      <Switch.Thumb />
    </Switch.Root>
  );
}

function renderCustomSwitch(checked: boolean) {
  return (
    <Switch.Root asChild checked={checked}>
      <textbutton AutoButtonColor={false} BorderSizePixel={0} Size={UDim2.fromOffset(46, 24)} Text="">
        <Switch.Thumb asChild>
          <frame BorderSizePixel={0} Size={UDim2.fromOffset(20, 20)}>
            <textlabel BackgroundTransparency={1} Text="custom-switch-thumb-marker" TextTransparency={1} />
          </frame>
        </Switch.Thumb>
      </textbutton>
    </Switch.Root>
  );
}

function renderConsumerOwnedCustomSwitch(checked: boolean, disabled = false) {
  return (
    <Switch.Root asChild checked={checked} disabled={disabled}>
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={CUSTOM_TRACK_COLOR}
        BorderSizePixel={0}
        Size={UDim2.fromOffset(46, 24)}
        Text=""
      >
        <Switch.Thumb asChild>
          <frame BorderSizePixel={0} Size={UDim2.fromOffset(20, 20)}>
            <textlabel BackgroundTransparency={1} Text="custom-switch-thumb-marker" TextTransparency={1} />
          </frame>
        </Switch.Thumb>
      </textbutton>
    </Switch.Root>
  );
}

function renderColorConfiguredCustomSwitch(checked: boolean, disabled = false) {
  return (
    <Switch.Root
      asChild
      checked={checked}
      disabled={disabled}
      disabledTrackColor={CUSTOM_DISABLED_TRACK_COLOR}
      trackOffColor={CUSTOM_TRACK_OFF_COLOR}
      trackOnColor={CUSTOM_TRACK_ON_COLOR}
    >
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={CUSTOM_TRACK_COLOR}
        BorderSizePixel={0}
        Size={UDim2.fromOffset(46, 24)}
        Text=""
      >
        <Switch.Thumb asChild>
          <frame BorderSizePixel={0} Size={UDim2.fromOffset(20, 20)}>
            <textlabel BackgroundTransparency={1} Text="custom-switch-thumb-marker" TextTransparency={1} />
          </frame>
        </Switch.Thumb>
      </textbutton>
    </Switch.Root>
  );
}

function renderSwitchOwnedCustomSwitch(checked: boolean, disabled = false) {
  return (
    <Switch.Root asChild checked={checked} disabled={disabled} trackColorMode="switch">
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={CUSTOM_TRACK_COLOR}
        BorderSizePixel={0}
        Size={UDim2.fromOffset(46, 24)}
        Text=""
      >
        <Switch.Thumb asChild>
          <frame BorderSizePixel={0} Size={UDim2.fromOffset(20, 20)}>
            <textlabel BackgroundTransparency={1} Text="custom-switch-thumb-marker" TextTransparency={1} />
          </frame>
        </Switch.Thumb>
      </textbutton>
    </Switch.Root>
  );
}

function renderConsumerModeColorConfiguredCustomSwitch(checked: boolean, disabled = false) {
  return (
    <Switch.Root
      asChild
      checked={checked}
      disabled={disabled}
      disabledTrackColor={CUSTOM_DISABLED_TRACK_COLOR}
      trackColorMode="consumer"
      trackOffColor={CUSTOM_TRACK_OFF_COLOR}
      trackOnColor={CUSTOM_TRACK_ON_COLOR}
    >
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={CUSTOM_TRACK_COLOR}
        BorderSizePixel={0}
        Size={UDim2.fromOffset(46, 24)}
        Text=""
      >
        <Switch.Thumb asChild>
          <frame BorderSizePixel={0} Size={UDim2.fromOffset(20, 20)}>
            <textlabel BackgroundTransparency={1} Text="custom-switch-thumb-marker" TextTransparency={1} />
          </frame>
        </Switch.Thumb>
      </textbutton>
    </Switch.Root>
  );
}

function getThumbTargetX(root: TextButton, checked: boolean) {
  return root.AbsolutePosition.X + (checked ? root.AbsoluteSize.X - 18 : 2);
}

function getCustomThumbTargetX(root: TextButton, checked: boolean) {
  return root.AbsolutePosition.X + (checked ? root.AbsoluteSize.X - 22 : 2);
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

        const uncheckedX = getThumbTargetX(root, false);
        const checkedX = getThumbTargetX(root, true);
        assertWithinTolerance(
          initialThumb.AbsolutePosition.X,
          uncheckedX,
          1,
          "Unchecked thumb should start at the leading edge.",
        );
        assert(root.BackgroundColor3 === TRACK_OFF_COLOR, "Unchecked switch track should start with the off color.");

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
        assert(
          enteringRoot.BackgroundColor3 !== TRACK_OFF_COLOR && enteringRoot.BackgroundColor3 !== TRACK_ON_COLOR,
          "Switch track color should tween instead of snapping on toggle.",
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
        assert(checkedRoot.BackgroundColor3 === TRACK_ON_COLOR, "Checked switch track should settle on the on color.");

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
        assert(
          finalRoot.BackgroundColor3 === TRACK_OFF_COLOR,
          "Unchecked switch track should settle back on the off color.",
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
          getThumbTargetX(root, true),
          1,
          "Rapid toggles should converge on the final checked thumb position.",
        );
        assert(
          root.BackgroundColor3 === TRACK_ON_COLOR,
          "Rapid toggles should converge on the final checked track color.",
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
          getCustomThumbTargetX(root, true),
          1,
          "Custom switch thumb should align to the checked edge without using the default thumb width.",
        );
      });
    });

    it("preserves consumer-owned track colors for asChild switches", () => {
      withReactHarness("SwitchAsChildConsumerColorOwnership", (harness) => {
        harness.render(renderConsumerOwnedCustomSwitch(false));
        waitForEffects(2);

        const uncheckedRoot = findCustomSwitchRoot(harness.container);
        assert(uncheckedRoot !== undefined, "Consumer-owned asChild switch should mount.");
        assert(
          uncheckedRoot.BackgroundColor3 === CUSTOM_TRACK_COLOR,
          "Unchecked asChild switch should preserve the consumer track color.",
        );

        harness.render(renderConsumerOwnedCustomSwitch(true));
        waitForEffects(2);
        task.wait(0.15);
        waitForEffects(1);

        const checkedRoot = findCustomSwitchRoot(harness.container);
        assert(checkedRoot !== undefined, "Checked asChild switch should remain mounted.");
        assert(
          checkedRoot.BackgroundColor3 === CUSTOM_TRACK_COLOR,
          "Checked asChild switch should keep the consumer track color when no track props are provided.",
        );

        harness.render(renderConsumerOwnedCustomSwitch(true, true));
        waitForEffects(2);

        const disabledRoot = findCustomSwitchRoot(harness.container);
        assert(disabledRoot !== undefined, "Disabled asChild switch should remain mounted.");
        assert(
          disabledRoot.BackgroundColor3 === CUSTOM_TRACK_COLOR,
          "Disabled asChild switch should keep consumer-owned track color by default.",
        );
      });
    });

    it("supports explicit switch-owned track colors for asChild switches", () => {
      withReactHarness("SwitchAsChildExplicitSwitchColorOwnership", (harness) => {
        harness.render(renderSwitchOwnedCustomSwitch(false));
        waitForEffects(2);

        const uncheckedRoot = findCustomSwitchRoot(harness.container);
        assert(uncheckedRoot !== undefined, "Explicit switch-owned asChild switch should mount.");
        assert(
          uncheckedRoot.BackgroundColor3 === TRACK_OFF_COLOR,
          "Unchecked explicit switch-owned asChild switch should settle on the default off color.",
        );

        harness.render(renderSwitchOwnedCustomSwitch(true));
        waitForEffects(2);
        task.wait(0.05);
        waitForEffects(1);

        const enteringRoot = findCustomSwitchRoot(harness.container);
        assert(
          enteringRoot !== undefined,
          "Explicit switch-owned asChild switch should remain mounted while animating.",
        );
        assert(
          enteringRoot.BackgroundColor3 !== TRACK_OFF_COLOR && enteringRoot.BackgroundColor3 !== TRACK_ON_COLOR,
          "Explicit switch-owned asChild switch should tween between unchecked and checked colors.",
        );

        task.wait(0.2);
        waitForEffects(2);

        const checkedRoot = findCustomSwitchRoot(harness.container);
        assert(checkedRoot !== undefined, "Explicit switch-owned asChild switch should settle after animating.");
        assert(
          checkedRoot.BackgroundColor3 === TRACK_ON_COLOR,
          "Checked explicit switch-owned asChild switch should settle on the default on color.",
        );

        harness.render(renderSwitchOwnedCustomSwitch(true, true));
        waitForEffects(2);
        task.wait(0.2);
        waitForEffects(2);

        const disabledRoot = findCustomSwitchRoot(harness.container);
        assert(disabledRoot !== undefined, "Explicit switch-owned disabled asChild switch should remain mounted.");
        assert(
          disabledRoot.BackgroundColor3 === DISABLED_TRACK_COLOR,
          "Explicit switch-owned disabled asChild switch should settle on the default disabled track color.",
        );
      });
    });

    it("lets explicit consumer mode override implicit asChild track color ownership", () => {
      withReactHarness("SwitchAsChildExplicitConsumerColorOwnership", (harness) => {
        harness.render(renderConsumerModeColorConfiguredCustomSwitch(false));
        waitForEffects(2);

        const uncheckedRoot = findCustomSwitchRoot(harness.container);
        assert(uncheckedRoot !== undefined, "Explicit consumer-mode asChild switch should mount.");
        assert(
          uncheckedRoot.BackgroundColor3 === CUSTOM_TRACK_COLOR,
          "Explicit consumer-mode asChild switch should preserve consumer color even with track color props.",
        );

        harness.render(renderConsumerModeColorConfiguredCustomSwitch(true));
        waitForEffects(2);
        task.wait(0.15);
        waitForEffects(1);

        const checkedRoot = findCustomSwitchRoot(harness.container);
        assert(checkedRoot !== undefined, "Explicit consumer-mode checked asChild switch should remain mounted.");
        assert(
          checkedRoot.BackgroundColor3 === CUSTOM_TRACK_COLOR,
          "Explicit consumer-mode asChild switch should keep consumer-owned color when checked.",
        );

        harness.render(renderConsumerModeColorConfiguredCustomSwitch(true, true));
        waitForEffects(2);

        const disabledRoot = findCustomSwitchRoot(harness.container);
        assert(disabledRoot !== undefined, "Explicit consumer-mode disabled asChild switch should remain mounted.");
        assert(
          disabledRoot.BackgroundColor3 === CUSTOM_TRACK_COLOR,
          "Explicit consumer-mode asChild switch should keep consumer-owned color while disabled.",
        );
      });
    });

    it("uses explicit asChild track color props and disabledTrackColor", () => {
      withReactHarness("SwitchAsChildColorOverrides", (harness) => {
        harness.render(renderColorConfiguredCustomSwitch(false));
        waitForEffects(2);

        const uncheckedRoot = findCustomSwitchRoot(harness.container);
        assert(uncheckedRoot !== undefined, "Configured asChild switch should mount.");
        assert(
          uncheckedRoot.BackgroundColor3 === CUSTOM_TRACK_OFF_COLOR,
          "Configured asChild switch should settle on trackOffColor when unchecked.",
        );

        harness.render(renderColorConfiguredCustomSwitch(true));
        waitForEffects(2);
        task.wait(0.05);
        waitForEffects(1);

        const enteringRoot = findCustomSwitchRoot(harness.container);
        assert(enteringRoot !== undefined, "Configured asChild switch should remain mounted while animating.");
        assert(
          enteringRoot.BackgroundColor3 !== CUSTOM_TRACK_OFF_COLOR &&
            enteringRoot.BackgroundColor3 !== CUSTOM_TRACK_ON_COLOR,
          "Configured asChild switch should tween between explicit unchecked and checked colors.",
        );

        task.wait(0.2);
        waitForEffects(2);

        const checkedRoot = findCustomSwitchRoot(harness.container);
        assert(checkedRoot !== undefined, "Configured asChild switch should settle after animating.");
        assert(
          checkedRoot.BackgroundColor3 === CUSTOM_TRACK_ON_COLOR,
          "Configured asChild switch should settle on trackOnColor when checked.",
        );

        harness.render(renderColorConfiguredCustomSwitch(true, true));
        waitForEffects(2);
        task.wait(0.2);
        waitForEffects(2);

        const disabledRoot = findCustomSwitchRoot(harness.container);
        assert(disabledRoot !== undefined, "Configured disabled asChild switch should remain mounted.");
        assert(
          disabledRoot.BackgroundColor3 === CUSTOM_DISABLED_TRACK_COLOR,
          "Configured disabled asChild switch should settle on disabledTrackColor.",
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
          getThumbTargetX(initialRoot, false),
          1,
          "Disabled switch should still render the unchecked thumb position correctly.",
        );
        assert(
          initialRoot.BackgroundColor3 === DISABLED_TRACK_COLOR,
          "Disabled switch should use a muted disabled track color while unchecked.",
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
          getThumbTargetX(checkedRoot, true),
          1,
          "Disabled controlled switch should still follow the external checked state.",
        );
        assert(
          checkedRoot.BackgroundColor3 === DISABLED_TRACK_COLOR,
          "Disabled controlled switch should keep the muted disabled track color after external updates.",
        );
      });
    });
  });
};
