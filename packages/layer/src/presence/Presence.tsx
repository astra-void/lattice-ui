import { React } from "@lattice-ui/core";
import { DEFAULT_PRESENCE_EXIT_FALLBACK_MS } from "../internals/constants";
import type { PresenceProps } from "./types";

export function Presence(props: PresenceProps) {
  const [mounted, setMounted] = React.useState(props.present);
  const [isPresent, setIsPresent] = React.useState(props.present);
  const mountedRef = React.useRef(mounted);
  const fallbackTaskRef = React.useRef<thread>();
  const onExitCompleteRef = React.useRef(props.onExitComplete);

  React.useEffect(() => {
    onExitCompleteRef.current = props.onExitComplete;
  }, [props.onExitComplete]);

  React.useEffect(() => {
    mountedRef.current = mounted;
  }, [mounted]);

  const completeExit = React.useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    const fallbackTask = fallbackTaskRef.current;
    if (fallbackTask) {
      if (fallbackTask !== coroutine.running()) {
        task.cancel(fallbackTask);
      }
      fallbackTaskRef.current = undefined;
    }

    mountedRef.current = false;
    setMounted(false);
    onExitCompleteRef.current?.();
  }, []);

  React.useEffect(() => {
    if (props.present) {
      const fallbackTask = fallbackTaskRef.current;
      if (fallbackTask) {
        if (fallbackTask !== coroutine.running()) {
          task.cancel(fallbackTask);
        }
        fallbackTaskRef.current = undefined;
      }

      if (!mountedRef.current) {
        mountedRef.current = true;
        setMounted(true);
      }
      setIsPresent(true);
      return;
    }

    if (!mountedRef.current) {
      return;
    }

    setIsPresent(false);

    const fallbackTask = fallbackTaskRef.current;
    if (fallbackTask) {
      if (fallbackTask !== coroutine.running()) {
        task.cancel(fallbackTask);
      }
      fallbackTaskRef.current = undefined;
    }

    const timeoutMs = props.exitFallbackMs ?? DEFAULT_PRESENCE_EXIT_FALLBACK_MS;
    fallbackTaskRef.current = task.delay(timeoutMs / 1000, () => {
      completeExit();
    });
  }, [completeExit, props.exitFallbackMs, props.present]);

  React.useEffect(() => {
    return () => {
      const fallbackTask = fallbackTaskRef.current;
      if (fallbackTask) {
        if (fallbackTask !== coroutine.running()) {
          task.cancel(fallbackTask);
        }
        fallbackTaskRef.current = undefined;
      }
    };
  }, []);

  if (!mounted) {
    return undefined;
  }

  const render = props.render ?? props.children;
  if (!render) {
    return undefined;
  }

  return render({
    isPresent,
    onExitComplete: completeExit,
  });
}
