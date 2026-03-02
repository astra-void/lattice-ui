import { React } from "@lattice-ui/core";
import { isOutsidePointerEvent } from "./events";
import { registerLayer, unregisterLayer } from "./layerStack";
import { Portal } from "../portal/Portal";
import { usePortalContext } from "../portal/PortalProvider";
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
  const shouldBlockOutsidePointer = props.modal === true || props.disableOutsidePointerEvents === true;

  const portalContext = usePortalContext();
  const contentRootRef = React.useRef<Frame>();
  const layerIdRef = React.useRef<number>();
  const [stackOrder, setStackOrder] = React.useState(0);

  const enabledRef = useLatest(enabled);
  const onDismissRef = useLatest(props.onDismiss);
  const onPointerDownOutsideRef = useLatest(props.onPointerDownOutside);
  const onInteractOutsideRef = useLatest(props.onInteractOutside);
  const onEscapeKeyDownRef = useLatest(props.onEscapeKeyDown);

  const callPointerDownOutside = React.useCallback((event: LayerInteractEvent) => {
    onPointerDownOutsideRef.current?.(event);
  }, []);

  const callInteractOutside = React.useCallback((event: LayerInteractEvent) => {
    onInteractOutsideRef.current?.(event);
  }, []);

  const callEscape = React.useCallback((event: LayerInteractEvent) => {
    onEscapeKeyDownRef.current?.(event);
  }, []);

  const callDismiss = React.useCallback(() => {
    onDismissRef.current?.();
  }, []);

  React.useEffect(() => {
    const registration = registerLayer({
      getEnabled: () => enabledRef.current,
      isPointerOutside: (inputObject) => {
        const contentRoot = contentRootRef.current;
        if (!contentRoot) {
          return false;
        }
        return isOutsidePointerEvent(inputObject, portalContext.container, contentRoot);
      },
      onPointerDownOutside: callPointerDownOutside,
      onInteractOutside: callInteractOutside,
      onEscapeKeyDown: callEscape,
      onDismiss: callDismiss,
    });

    layerIdRef.current = registration.id;
    setStackOrder(registration.mountOrder);

    return () => {
      unregisterLayer(registration.id);
      layerIdRef.current = undefined;
    };
  }, []);

  return (
    <Portal>
      <screengui
        key={`Layer_${stackOrder}`}
        DisplayOrder={portalContext.displayOrderBase + stackOrder}
        IgnoreGuiInset={true}
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
          ref={contentRootRef}
          ZIndex={1}
        >
          {props.children}
        </frame>
      </screengui>
    </Portal>
  );
}
