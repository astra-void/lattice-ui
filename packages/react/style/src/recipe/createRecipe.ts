import { mergeGuiProps } from "../sx/mergeGuiProps";
import type { Sx } from "../sx/sx";
import { resolveSx } from "../sx/sx";
import type { Theme } from "../theme/types";

type GuiPropRecord = Record<string, unknown>;

export type RecipeVariants<Props extends GuiPropRecord> = Record<string, Record<string, Sx<Props>>>;
export type RecipeSelection<Variants extends RecipeVariants<GuiPropRecord>> = Partial<
  Record<keyof Variants & string, string>
>;

export type RecipeConfig<Props extends GuiPropRecord, Variants extends RecipeVariants<Props>> = {
  base?: Sx<Props>;
  variants?: Variants;
  defaultVariants?: RecipeSelection<Variants>;
  compoundVariants?: Array<{
    variants: RecipeSelection<Variants>;
    sx: Sx<Props>;
  }>;
};

function isCompoundMatch<Variants extends RecipeVariants<GuiPropRecord>>(
  candidate: RecipeSelection<Variants>,
  resolvedSelection: RecipeSelection<Variants>,
) {
  const candidateRecord = candidate as Record<string, string | undefined>;
  const resolvedRecord = resolvedSelection as Record<string, string | undefined>;

  for (const [rawVariantName, rawExpectedValue] of pairs(candidateRecord)) {
    if (!typeIs(rawVariantName, "string") || !typeIs(rawExpectedValue, "string")) {
      continue;
    }

    const actualValue = resolvedRecord[rawVariantName];
    if (actualValue !== rawExpectedValue) {
      return false;
    }
  }

  return true;
}

export function createRecipe<Props extends GuiPropRecord, Variants extends RecipeVariants<Props>>(
  config: RecipeConfig<Props, Variants>,
) {
  return (selection: RecipeSelection<Variants> | undefined, theme: Theme): Partial<Props> => {
    const resolvedSelection = {
      ...(config.defaultVariants ?? {}),
      ...(selection ?? {}),
    } as RecipeSelection<Variants>;

    let merged = resolveSx(config.base, theme);

    const variants = config.variants;
    if (variants) {
      const variantsRecord = variants as Record<string, Record<string, Sx<Props>>>;
      const resolvedRecord = resolvedSelection as Record<string, string | undefined>;

      for (const [rawVariantName, rawVariantMap] of pairs(variantsRecord)) {
        if (!typeIs(rawVariantName, "string") || !typeIs(rawVariantMap, "table")) {
          continue;
        }

        const selectedValue = resolvedRecord[rawVariantName];
        if (selectedValue === undefined) {
          continue;
        }

        const sx = rawVariantMap[selectedValue];
        merged = mergeGuiProps(merged, resolveSx(sx, theme));
      }
    }

    for (const compound of config.compoundVariants ?? []) {
      if (!isCompoundMatch(compound.variants, resolvedSelection)) {
        continue;
      }

      merged = mergeGuiProps(merged, resolveSx(compound.sx, theme));
    }

    return merged;
  };
}
