// @ts-nocheck
import { describe, expect, it } from "vitest";
import { createRecipe } from "../../../packages/react/style/src/recipe/createRecipe";

// Luau `pairs` gives no order for string keys, so the merge order of variant
// groups must not depend on how the table was declared. JS keeps insertion
// order, so declaring the groups out of name order here shows the recipe
// sorts them instead of following iteration order.
const theme = {} as never;

describe("createRecipe", () => {
  it("merges variant groups in sorted name order, not declaration order", () => {
    const sizeFirst = createRecipe({
      variants: {
        size: { lg: { TextSize: 20 } },
        density: { compact: { TextSize: 12 } },
      },
    });
    const densityFirst = createRecipe({
      variants: {
        density: { compact: { TextSize: 12 } },
        size: { lg: { TextSize: 20 } },
      },
    });

    const selection = { size: "lg", density: "compact" };
    // "size" sorts after "density", so it is merged last and wins.
    expect(sizeFirst(selection, theme).TextSize).toBe(20);
    expect(densityFirst(selection, theme).TextSize).toBe(20);
  });

  it("keeps properties that only one group sets", () => {
    const recipe = createRecipe({
      base: { Visible: true },
      variants: {
        tone: { accent: { TextColor3: "accent" } },
        size: { sm: { TextSize: 12 } },
      },
    });

    expect(recipe({ tone: "accent", size: "sm" }, theme)).toEqual({
      Visible: true,
      TextColor3: "accent",
      TextSize: 12,
    });
  });

  it("applies defaultVariants and lets the selection override them", () => {
    const recipe = createRecipe({
      variants: { size: { sm: { TextSize: 12 }, lg: { TextSize: 20 } } },
      defaultVariants: { size: "sm" },
    });

    expect(recipe(undefined, theme).TextSize).toBe(12);
    expect(recipe({ size: "lg" }, theme).TextSize).toBe(20);
  });

  it("applies matching compound variants after every variant group", () => {
    const recipe = createRecipe({
      variants: {
        size: { lg: { TextSize: 20 } },
        density: { compact: { TextSize: 12 } },
      },
      compoundVariants: [{ variants: { size: "lg", density: "compact" }, sx: { TextSize: 16 } }],
    });

    expect(recipe({ size: "lg", density: "compact" }, theme).TextSize).toBe(16);
    expect(recipe({ size: "lg" }, theme).TextSize).toBe(20);
  });

  it("composes Event handlers from every merged group in merge order", () => {
    const calls: string[] = [];
    const recipe = createRecipe({
      base: { Event: { Activated: () => calls.push("base") } },
      variants: {
        size: { lg: { Event: { Activated: () => calls.push("size") } } },
        density: { compact: { Event: { Activated: () => calls.push("density") } } },
      },
    });

    recipe({ size: "lg", density: "compact" }, theme).Event.Activated();
    expect(calls).toEqual(["base", "density", "size"]);
  });
});
