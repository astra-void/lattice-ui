type GuiHandler = (...args: unknown[]) => void;
type GuiHandlerTable = Partial<Record<string, GuiHandler>>;
type GuiPropRecord = Record<string, unknown>;

function isRecord(value: unknown): value is GuiPropRecord {
  return typeIs(value, "table");
}

function isFn(value: unknown): value is GuiHandler {
  return typeIs(value, "function");
}

function toHandlerTable(value: unknown): GuiHandlerTable | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const out: GuiHandlerTable = {};
  for (const [rawKey, candidate] of pairs(value)) {
    if (!typeIs(rawKey, "string") || !isFn(candidate)) {
      continue;
    }

    out[rawKey] = candidate;
  }

  return next(out)[0] !== undefined ? out : undefined;
}

function mergeHandlerTables(tables: Array<GuiHandlerTable | undefined>): GuiHandlerTable | undefined {
  const out: GuiHandlerTable = {};

  for (const handlerTable of tables) {
    if (!handlerTable) {
      continue;
    }

    for (const [rawKey, candidate] of pairs(handlerTable)) {
      if (!typeIs(rawKey, "string") || !isFn(candidate)) {
        continue;
      }

      const previous = out[rawKey];
      out[rawKey] =
        previous !== undefined
          ? (...args: unknown[]) => {
              previous(...args);
              candidate(...args);
            }
          : candidate;
    }
  }

  return next(out)[0] !== undefined ? out : undefined;
}

/**
 * Merges GUI prop layers. Plain props: later layers win (`user` over `variant`
 * over `base`). `Event` and `Change` tables are composed per key instead, so
 * every layer's handler runs, in `base`, `variant`, `user` order.
 *
 * Components in `@lattice-ui/react-style` and `@lattice-ui/react-system` call
 * this as `(defaults, sx, directProps)`, so direct props win over `sx`.
 */
export function mergeGuiProps<Props extends GuiPropRecord>(
  base?: Partial<Props>,
  variant?: Partial<Props>,
  user?: Partial<Props>,
): Partial<Props> {
  const merged = {
    ...(base ?? {}),
    ...(variant ?? {}),
    ...(user ?? {}),
  } as Partial<Props>;

  const mergedEvent = mergeHandlerTables([
    toHandlerTable(base?.Event),
    toHandlerTable(variant?.Event),
    toHandlerTable(user?.Event),
  ]);
  if (mergedEvent) {
    (merged as GuiPropRecord).Event = mergedEvent;
  }

  const mergedChange = mergeHandlerTables([
    toHandlerTable(base?.Change),
    toHandlerTable(variant?.Change),
    toHandlerTable(user?.Change),
  ]);
  if (mergedChange) {
    (merged as GuiPropRecord).Change = mergedChange;
  }

  return merged;
}
