import { React } from "@lattice-ui/core";
import { AvatarContextProvider } from "./context";
import type { AvatarStatus } from "./state";
import type { AvatarProps } from "./types";

export function AvatarRoot(props: AvatarProps) {
  const delayMs = math.max(0, props.delayMs ?? 250);
  const hasSource = props.src !== undefined && props.src.size() > 0;

  const [status, setStatus] = React.useState<AvatarStatus>(hasSource ? "loading" : "error");
  const [delayElapsed, setDelayElapsed] = React.useState(!hasSource);
  const sequenceRef = React.useRef(0);
  const isFirstStatusRun = React.useRef(true);

  // Reset status only when the source actually changes. delayMs changes must not
  // reset here: this parent effect runs AFTER the child AvatarImage effects, so
  // resetting to "loading" would clobber a "loaded"/"error" status the image just
  // reported — and since ImageLabel.IsLoaded stays true, the change signal never
  // fires again, leaving the avatar permanently blank.
  React.useEffect(() => {
    if (isFirstStatusRun.current) {
      // useState already seeded the initial status for the first source.
      isFirstStatusRun.current = false;
      return;
    }

    if (props.src === undefined || props.src.size() === 0) {
      setStatus("error");
      return;
    }

    setStatus("loading");
  }, [props.src]);

  // Arm the fallback-reveal delay whenever the source or delayMs changes.
  React.useEffect(() => {
    sequenceRef.current += 1;
    const sequence = sequenceRef.current;

    if (props.src === undefined || props.src.size() === 0) {
      setDelayElapsed(true);
      return;
    }

    setDelayElapsed(false);

    const delaySeconds = delayMs / 1000;
    const handle = task.delay(delaySeconds, () => {
      if (sequenceRef.current !== sequence) {
        return;
      }

      setDelayElapsed(true);
    });

    return () => {
      pcall(() => task.cancel(handle));
    };
  }, [delayMs, props.src]);

  const contextValue = React.useMemo(
    () => ({
      src: props.src,
      status,
      setStatus,
      delayElapsed,
    }),
    [delayElapsed, props.src, status],
  );

  return <AvatarContextProvider value={contextValue}>{props.children}</AvatarContextProvider>;
}

export { AvatarRoot as Avatar };
