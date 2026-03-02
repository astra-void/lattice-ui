import React from "@rbxts/react";

export function createStrictContext<T>(name: string) {
  const Ctx = React.createContext<T | undefined>(undefined);

  function useCtx(): T {
    const v = React.useContext(Ctx);
    if (v === undefined) {
      error(`[${name}] context is undefined. Wrap components with <${name}.Provider>.`);
    }
    return v;
  }

  return [Ctx.Provider, useCtx] as const;
}
