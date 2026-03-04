import { React } from "@lattice-ui/core";
import { ToastContextProvider, useToastContext } from "./context";
import { enqueueToast, getVisibleToasts, pruneExpiredToasts, type ToastRecord } from "./queue";
import type { ToastApi, ToastOptions, ToastProviderProps } from "./types";

const RunService = game.GetService("RunService");

function nowMs() {
  return math.floor(os.clock() * 1000);
}

export function ToastProvider(props: ToastProviderProps) {
  const defaultDurationMs = math.max(0, props.defaultDurationMs ?? 4000);
  const maxVisible = math.max(1, props.maxVisible ?? 3);

  const [toasts, setToasts] = React.useState<Array<ToastRecord>>([]);
  const idSequenceRef = React.useRef(0);

  const enqueue = React.useCallback((options: ToastOptions) => {
    idSequenceRef.current += 1;
    const id = options.id ?? `toast-${idSequenceRef.current}`;

    setToasts((currentQueue) =>
      enqueueToast(currentQueue, {
        id,
        title: options.title,
        description: options.description,
        durationMs: options.durationMs,
        createdAtMs: nowMs(),
      }),
    );

    return id;
  }, []);

  const remove = React.useCallback((id: string) => {
    setToasts((currentQueue) => currentQueue.filter((toast) => toast.id !== id));
  }, []);

  const clear = React.useCallback(() => {
    setToasts([]);
  }, []);

  React.useEffect(() => {
    if (toasts.size() === 0) {
      return;
    }

    const connection = RunService.Heartbeat.Connect(() => {
      setToasts((currentQueue) => pruneExpiredToasts(currentQueue, nowMs(), maxVisible, defaultDurationMs));
    });

    return () => {
      connection.Disconnect();
    };
  }, [defaultDurationMs, maxVisible, toasts.size()]);

  const visibleToasts = React.useMemo(() => getVisibleToasts(toasts, maxVisible), [maxVisible, toasts]);

  const contextValue = React.useMemo(
    () => ({
      toasts,
      visibleToasts,
      defaultDurationMs,
      maxVisible,
      enqueue,
      remove,
      clear,
    }),
    [clear, defaultDurationMs, enqueue, maxVisible, remove, toasts, visibleToasts],
  );

  return <ToastContextProvider value={contextValue}>{props.children}</ToastContextProvider>;
}

export function useToast(): ToastApi {
  const toastContext = useToastContext();
  return {
    toasts: toastContext.toasts,
    visibleToasts: toastContext.visibleToasts,
    enqueue: toastContext.enqueue,
    remove: toastContext.remove,
    clear: toastContext.clear,
  };
}
