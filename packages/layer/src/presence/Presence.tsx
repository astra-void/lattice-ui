import { React } from "@lattice-ui/core";
import { DEFAULT_PRESENCE_EXIT_FALLBACK_MS } from "../internals/constants";
import type { PresenceProps } from "./types";

function cancelFallbackTask(taskRef: React.MutableRefObject<thread | undefined>, currentThread?: thread) {
  const fallbackTask = taskRef.current;
  taskRef.current = undefined;

  if (!fallbackTask || fallbackTask === currentThread) {
    return;
  }

  const [hasStatus, status] = pcall(() => coroutine.status(fallbackTask));
  if (hasStatus && status === "dead") {
    return;
  }

  pcall(() => {
    task.cancel(fallbackTask);
  });
}

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

    cancelFallbackTask(fallbackTaskRef, coroutine.running());

    mountedRef.current = false;
    setMounted(false);
    onExitCompleteRef.current?.();
  }, []);

  React.useEffect(() => {
    if (props.present) {
      cancelFallbackTask(fallbackTaskRef, coroutine.running());

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
    cancelFallbackTask(fallbackTaskRef, coroutine.running());

    const timeoutMs = props.exitFallbackMs ?? DEFAULT_PRESENCE_EXIT_FALLBACK_MS;
    fallbackTaskRef.current = task.delay(timeoutMs / 1000, () => {
      completeExit();
    });
  }, [completeExit, props.exitFallbackMs, props.present]);

  React.useEffect(() => {
    return () => {
      cancelFallbackTask(fallbackTaskRef, coroutine.running());
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
