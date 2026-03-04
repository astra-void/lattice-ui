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

  React.useEffect(() => {
    sequenceRef.current += 1;
    const sequence = sequenceRef.current;

    if (props.src === undefined || props.src.size() === 0) {
      setStatus("error");
      setDelayElapsed(true);
      return;
    }

    setStatus("loading");
    setDelayElapsed(false);

    const delaySeconds = delayMs / 1000;
    task.delay(delaySeconds, () => {
      if (sequenceRef.current !== sequence) {
        return;
      }

      setDelayElapsed(true);
    });
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
