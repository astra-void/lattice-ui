import { React } from "@lattice-ui/core";
import { ToastContextProvider, useToastContext } from "./context";
import {
  clearToasts,
  enqueueToast,
  finalizeToast,
  getVisibleToasts,
  pruneExpiredToasts,
  type ToastRecord,
} from "./queue";
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

  const remove = React.useCallback(
    (id: string) => {
      setToasts((currentQueue) => {
        const nextQueue = [...currentQueue];
        const index = nextQueue.findIndex((toast) => toast.id === id);
        if (index < 0) {
          return currentQueue;
        }

        const toast = nextQueue[index];
        if (!toast) {
          return currentQueue;
        }

        if (toast.exiting) {
          return currentQueue;
        }

        if (index >= maxVisible) {
          return nextQueue.filter((entry) => entry.id !== id);
        }

        nextQueue[index] = {
          ...toast,
          exiting: true,
          exitStartedAtMs: nowMs(),
        };

        return nextQueue;
      });
    },
    [maxVisible],
  );

  const finalize = React.useCallback((id: string) => {
    setToasts((currentQueue) => finalizeToast(currentQueue, id));
  }, []);

  const clear = React.useCallback(() => {
    setToasts((currentQueue) => clearToasts(currentQueue, nowMs(), maxVisible));
  }, [maxVisible]);

  const hasToasts = toasts.size() > 0;

  React.useEffect(() => {
    if (!hasToasts) {
      return;
    }

    const connection = RunService.Heartbeat.Connect(() => {
      setToasts((currentQueue) => pruneExpiredToasts(currentQueue, nowMs(), maxVisible, defaultDurationMs));
    });

    return () => {
      connection.Disconnect();
    };
  }, [defaultDurationMs, maxVisible, hasToasts]);

  const visibleToasts = React.useMemo(() => getVisibleToasts(toasts, maxVisible), [maxVisible, toasts]);

  const contextValue = React.useMemo(
    () => ({
      toasts,
      visibleToasts,
      defaultDurationMs,
      maxVisible,
      enqueue,
      remove,
      finalize,
      clear,
    }),
    [clear, defaultDurationMs, enqueue, finalize, maxVisible, remove, toasts, visibleToasts],
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
    finalize: toastContext.finalize,
    clear: toastContext.clear,
  };
}
