# @lattice-ui/toast

Headless toast primitives for Roblox UI with queue-based visibility and automatic dismissal.

## Exports

- `Toast`
- `Toast.Provider`
- `Toast.Viewport`
- `Toast.Root`
- `Toast.Title`
- `Toast.Description`
- `Toast.Action`
- `Toast.Close`
- `useToast`

## Notes

- Imperative API is provided through `useToast()`.
- Default toast timing is `durationMs=4000` with `maxVisible=3`.
- Queue helpers are exported for deterministic unit testing.
