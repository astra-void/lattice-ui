import { React, Slot } from "@lattice-ui/react-runtime";
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

  const setStatus = avatarContext.setStatus;
  const status = avatarContext.status;

  React.useEffect(() => {
    if (source === undefined || source.size() === 0) {
      setStatus("error");
      return;
    }

    setStatus("loading");
  }, [setStatus, source]);

  // `status` is a dependency so this re-runs after the root resets to "loading"
  // (e.g. on a source change): if the texture is already cached — IsLoaded true
  // and no further change signal — we re-report "loaded" instead of staying blank.
  React.useEffect(() => {
    // Mirror the sibling effect's empty-source guard: with no source the status is
    // "error", and a stale IsLoaded=true must not overwrite it with "loaded".
    if (source === undefined || source.size() === 0) {
      return;
    }

    const image = imageRef.current;
    if (!image) {
      return;
    }

    if (image.IsLoaded) {
      setStatus("loaded");
    }

    const connection = image.GetPropertyChangedSignal("IsLoaded").Connect(() => {
      if (image.IsLoaded) {
        setStatus("loaded");
      }
    });

    return () => {
      connection.Disconnect();
    };
  }, [setStatus, source, status]);

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
