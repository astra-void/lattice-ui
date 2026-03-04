import { React, Slot } from "@lattice-ui/core";
import { useToastContext } from "./context";
import { ToastClose } from "./ToastClose";
import { ToastDescription } from "./ToastDescription";
import { ToastRoot } from "./ToastRoot";
import { ToastTitle } from "./ToastTitle";
import type { ToastViewportProps } from "./types";

export function ToastViewport(props: ToastViewportProps) {
  const toastContext = useToastContext();

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[ToastViewport] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return (
    <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromOffset(340, 320)}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 8)} SortOrder={Enum.SortOrder.LayoutOrder} />
      {toastContext.visibleToasts.map((toast) => (
        <ToastRoot key={toast.id}>
          <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromOffset(300, 22)}>
            <ToastTitle asChild>
              <textlabel
                BackgroundTransparency={1}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(264, 20)}
                Text={toast.title ?? "Notification"}
                TextColor3={Color3.fromRGB(235, 240, 248)}
                TextSize={14}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </ToastTitle>
            <ToastClose asChild onClose={() => toastContext.remove(toast.id)}>
              <textbutton
                AutoButtonColor={false}
                BackgroundTransparency={1}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(274, 0)}
                Size={UDim2.fromOffset(24, 20)}
                Text="X"
                TextColor3={Color3.fromRGB(172, 180, 196)}
                TextSize={12}
              />
            </ToastClose>
          </frame>
          <ToastDescription asChild>
            <textlabel
              BackgroundTransparency={1}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(0, 24)}
              Size={UDim2.fromOffset(300, 18)}
              Text={toast.description ?? ""}
              TextColor3={Color3.fromRGB(172, 180, 196)}
              TextSize={13}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </ToastDescription>
        </ToastRoot>
      ))}
      {props.children}
    </frame>
  );
}
