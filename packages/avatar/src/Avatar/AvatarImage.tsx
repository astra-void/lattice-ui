import { React, Slot } from "@lattice-ui/core";
import { useAvatarContext } from "./context";
import type { AvatarImageProps } from "./types";

function toImageLabel(instance: Instance | undefined) {
  if (!instance?.IsA("ImageLabel")) {
    return undefined;
  }

  return instance;
}

export function AvatarImage(props: AvatarImageProps) {
  const avatarContext = useAvatarContext();
  const source = props.src ?? avatarContext.src;

  const imageRef = React.useRef<ImageLabel>();

  const setImageRef = React.useCallback((instance: Instance | undefined) => {
    imageRef.current = toImageLabel(instance);
  }, []);

  React.useEffect(() => {
    if (source === undefined || source.size() === 0) {
      avatarContext.setStatus("error");
      return;
    }

    avatarContext.setStatus("loading");
  }, [avatarContext, source]);

  React.useEffect(() => {
    const image = imageRef.current;
    if (!image) {
      return;
    }

    if (image.IsLoaded) {
      avatarContext.setStatus("loaded");
    }

    const connection = image.GetPropertyChangedSignal("IsLoaded").Connect(() => {
      if (image.IsLoaded) {
        avatarContext.setStatus("loaded");
      }
    });

    return () => {
      connection.Disconnect();
    };
  }, [avatarContext, source]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[AvatarImage] `asChild` requires a child element.");
    }

    return (
      <Slot Image={source ?? ""} Visible={avatarContext.status === "loaded"} ref={setImageRef}>
        {child}
      </Slot>
    );
  }

  return (
    <imagelabel
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Image={source ?? ""}
      Size={UDim2.fromOffset(40, 40)}
      Visible={avatarContext.status === "loaded"}
      ref={setImageRef}
    >
      <uicorner CornerRadius={new UDim(1, 0)} />
    </imagelabel>
  );
}
