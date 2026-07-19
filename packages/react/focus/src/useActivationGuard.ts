import { React } from "@lattice-ui/react-runtime";

export type ActivationGuard = () => boolean;

/**
 * Dedupes the gamepad/keyboard "double-fire" on a selectable button.
 *
 * Once a button is `Selectable` and owns a focus node, a single selection
 * activation (gamepad `ButtonA`, or `Return`/`Space` while selected) makes the
 * engine fire BOTH `Activated` and an `InputBegan` carrying `KeyCode.Return`/
 * `Space`. A handler wired on both events therefore runs twice; for toggle-style
 * actions (`setOpen(!open)`, `toggleItem`, `toggleValue`) the second run cancels
 * the first and the button appears inert.
 *
 * `useActivationGuard` returns a `claim()` function. The first handler to call
 * it during an activation gets `true` and should perform the action; any further
 * calls before the next scheduler resumption get `false` and should bail. The
 * claim clears on `task.defer`, so distinct activations (separate frames) are
 * always handled — this only collapses the paired events of one activation.
 */
export function useActivationGuard(): ActivationGuard {
  const claimedRef = React.useRef(false);

  return React.useCallback(() => {
    if (claimedRef.current) {
      return false;
    }

    claimedRef.current = true;
    task.defer(() => {
      claimedRef.current = false;
    });

    return true;
  }, []);
}
