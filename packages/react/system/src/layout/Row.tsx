import { React } from "@lattice-ui/react-runtime";
import { Stack } from "./Stack";
import type { RowProps } from "./types";

export const Row = React.forwardRef<Frame, RowProps>((props, ref) => {
  return <Stack {...props} direction="horizontal" ref={ref} />;
});
Row.displayName = "Row";
