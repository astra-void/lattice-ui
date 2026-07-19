import { composeRefs, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { useAvatarContext } from "./context";
import type { AvatarImageProps } from "./types";

const OWN_PROPS = ["asChild", "src", "children"] as const;

// See AvatarFallback: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

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

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  const behaviorProps = {
    // `Image` is data, not appearance: it is the source the load state is derived from.
    Image: source ?? "",
    Visible: avatarContext.status === "loaded",
    ref: composeRefs<Instance>(passthrough.ref as never, setImageRef),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[AvatarImage] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...passthrough} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return <imagelabel {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} />;
}
