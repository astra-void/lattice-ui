import { React } from "@lattice-ui/core";
import { Switch } from "@lattice-ui/switch";
import { findFirstDescendant } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function findThumbFrame(root: Instance, width: number) {
  const matched = findFirstDescendant(
    root,
    (instance) => instance.IsA("Frame") && instance.AbsoluteSize.X === width && instance.AbsoluteSize.Y === 20,
  );
  if (!matched || !matched.IsA("Frame")) {
    return undefined;
  }

  return matched;
}

export = () => {
  describe("switch", () => {
    it("positions the default thumb from switch checked state", () => {
      withReactHarness("SwitchDefaultThumbPosition", (harness) => {
        const renderTree = (checked: boolean) => (
          <Switch.Root asChild checked={checked}>
            <textbutton Text="">
              <frame Size={UDim2.fromOffset(46, 24)}>
                <Switch.Thumb />
              </frame>
            </textbutton>
          </Switch.Root>
        );

        harness.render(renderTree(false));
        waitForEffects(3);
        const uncheckedThumb = findFirstDescendant(
          harness.container,
          (instance) => instance.IsA("Frame") && instance.AbsoluteSize.X === 16 && instance.AbsoluteSize.Y === 16,
        );
        assert(uncheckedThumb !== undefined && uncheckedThumb.IsA("Frame"), "Default SwitchThumb should mount.");
        assert(uncheckedThumb.Position.X.Offset === 2, "Unchecked default thumb should align to the leading edge.");
        assert(uncheckedThumb.Position.X.Scale === 0, "Unchecked default thumb should use offset positioning.");

        harness.render(renderTree(true));
        waitForEffects(3);
        const checkedThumb = findFirstDescendant(
          harness.container,
          (instance) => instance.IsA("Frame") && instance.AbsoluteSize.X === 16 && instance.AbsoluteSize.Y === 16,
        );
        assert(
          checkedThumb !== undefined && checkedThumb.IsA("Frame"),
          "Checked default SwitchThumb should remain mounted.",
        );
        assert(checkedThumb.Position.X.Scale === 1, "Checked default thumb should anchor from the trailing edge.");
        assert(checkedThumb.Position.X.Offset === -18, "Checked default thumb should shift to the trailing offset.");
      });
    });

    it("keeps thumb mounted while unchecked without forceMount", () => {
      withReactHarness("SwitchThumbUnchecked", (harness) => {
        harness.render(
          <Switch.Root asChild checked={false}>
            <textbutton Text="">
              <Switch.Thumb asChild>
                <frame Size={UDim2.fromOffset(20, 20)} />
              </Switch.Thumb>
            </textbutton>
          </Switch.Root>,
        );

        waitForEffects(3);
        const thumb = findThumbFrame(harness.container, 20);
        assert(thumb !== undefined, "SwitchThumb should remain mounted while unchecked without forceMount.");
        assert(thumb.Visible === true, "SwitchThumb should stay visible unless the caller hides it.");
      });
    });

    it("keeps the same thumb mounted across checked transitions", () => {
      withReactHarness("SwitchThumbToggle", (harness) => {
        const renderTree = (checked: boolean) => (
          <Switch.Root asChild checked={checked}>
            <textbutton Text="">
              <Switch.Thumb asChild>
                <frame
                  Position={checked ? UDim2.fromOffset(24, 2) : UDim2.fromOffset(2, 2)}
                  Size={UDim2.fromOffset(20, 20)}
                />
              </Switch.Thumb>
            </textbutton>
          </Switch.Root>
        );

        harness.render(renderTree(false));
        waitForEffects(3);
        const uncheckedThumb = findThumbFrame(harness.container, 20);
        assert(uncheckedThumb !== undefined, "SwitchThumb should mount for unchecked state.");
        assert(
          uncheckedThumb.Position.X.Offset === 2,
          "Unchecked switch should use the caller-provided thumb position.",
        );

        harness.render(renderTree(true));
        waitForEffects(3);
        const checkedThumb = findThumbFrame(harness.container, 20);
        assert(checkedThumb !== undefined, "SwitchThumb should remain mounted after toggling on.");
        assert(checkedThumb === uncheckedThumb, "SwitchThumb should not unmount and remount across toggles.");
        assert(
          checkedThumb.Position.X.Offset === 24,
          "Checked switch should reflect the caller-provided thumb position update.",
        );
      });
    });

    it("treats forceMount as a compatibility no-op", () => {
      withReactHarness("SwitchThumbForceMountNoop", (harness) => {
        harness.render(
          <Switch.Root asChild checked={false}>
            <textbutton Text="">
              <Switch.Thumb asChild forceMount>
                <frame Size={UDim2.fromOffset(20, 20)} />
              </Switch.Thumb>
            </textbutton>
          </Switch.Root>,
        );

        waitForEffects(3);
        const thumb = findThumbFrame(harness.container, 20);
        assert(thumb !== undefined, "SwitchThumb should still mount when forceMount is passed.");
        assert(thumb.Visible === true, "forceMount should not change default visible behavior after the fix.");
      });
    });
  });
};
