import { FocusLayerProvider, React } from "@lattice-ui/core";
import { DEFAULT_LAYER_IGNORE_GUI_INSET } from "../internals/constants";
import { Portal } from "../portal/Portal";
import { usePortalContext } from "../portal/PortalProvider";
import { isOutsidePointerEvent } from "./events";
import { registerLayer, unregisterLayer } from "./layerStack";
import type { DismissableLayerProps, LayerInteractEvent } from "./types";

function useLatest<T>(value: T) {
  const ref = React.useRef(value);
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

export function DismissableLayer(props: DismissableLayerProps) {
  const enabled = props.enabled ?? true;
  const shouldBlockOutsidePointer = enabled && (props.modal === true || props.disableOutsidePointerEvents === true);
  const layerIgnoresGuiInset = DEFAULT_LAYER_IGNORE_GUI_INSET;

  const portalContext = usePortalContext();
  const contentWrapperRef = React.useRef<Frame>();
  const [stackOrder, setStackOrder] = React.useState(0);

  const enabledRef = useLatest(enabled);
  const insideRefsRef = useLatest(props.insideRefs ?? []);
  const onDismissRef = useLatest(props.onDismiss);
  const onPointerDownOutsideRef = useLatest(props.onPointerDownOutside);
  const onInteractOutsideRef = useLatest(props.onInteractOutside);

  const callPointerDownOutside = React.useCallback((event: LayerInteractEvent) => {
    onPointerDownOutsideRef.current?.(event);
  }, []);

  const callInteractOutside = React.useCallback((event: LayerInteractEvent) => {
    onInteractOutsideRef.current?.(event);
  }, []);

  const callDismiss = React.useCallback(() => {
    onDismissRef.current?.();
  }, []);

  React.useEffect(() => {
    const registration = registerLayer({
      getEnabled: () => enabledRef.current,
      isPointerOutside: (inputObject) => {
        const contentWrapper = contentWrapperRef.current;
        if (!contentWrapper) {
          return false;
        }

        const insideRoots = insideRefsRef.current.map((ref) => ref.current);
        return isOutsidePointerEvent(inputObject, portalContext.container, contentWrapper, {
          insideRoots,
          layerIgnoresGuiInset,
        });
      },
      onPointerDownOutside: callPointerDownOutside,
      onInteractOutside: callInteractOutside,
      onDismiss: callDismiss,
    });

    setStackOrder(registration.mountOrder);

    return () => {
      unregisterLayer(registration.id);
    };
  }, [
    callDismiss,
    callInteractOutside,
    callPointerDownOutside,
    enabledRef,
    insideRefsRef,
    layerIgnoresGuiInset,
    portalContext.container,
  ]);

  return (
    <Portal>
      <screengui
        key={`Layer_${stackOrder}`}
        DisplayOrder={portalContext.displayOrderBase + stackOrder}
        IgnoreGuiInset={layerIgnoresGuiInset}
        ResetOnSpawn={false}
        ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
      >
        {shouldBlockOutsidePointer ? (
          <textbutton
            Active={true}
            AutoButtonColor={false}
            BackgroundTransparency={1}
            BorderSizePixel={0}
            Modal={true}
            Position={UDim2.fromScale(0, 0)}
            Selectable={false}
            Size={UDim2.fromScale(1, 1)}
            Text=""
            TextTransparency={1}
            ZIndex={0}
          />
        ) : undefined}
        <frame
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Position={UDim2.fromScale(0, 0)}
          Size={UDim2.fromScale(1, 1)}
          ref={contentWrapperRef}
          ZIndex={1}
        >
          <FocusLayerProvider layerOrder={stackOrder}>{props.children}</FocusLayerProvider>
        </frame>
      </screengui>
    </Portal>
  );
}
