export type ComboboxOption = {
  value: string;
  disabled: boolean;
  textValue: string;
};

export type ComboboxFilterFn = (itemText: string, query: string) => boolean;

export function defaultComboboxFilter(itemText: string, query: string) {
  const normalizedItemText = string.lower(itemText);
  const normalizedQuery = string.lower(query);
  // Destructure the LuaTuple: comparing `string.find(...)` directly against
  // `undefined` makes roblox-ts wrap the multi-return in a table, which is
  // always truthy — so the filter would match every item.
  const [matchStart] = string.find(normalizedItemText, normalizedQuery, 1, true);
  return matchStart !== undefined;
}

export function resolveForcedComboboxValue(currentValue: string | undefined, options: Array<ComboboxOption>) {
  if (currentValue === undefined) {
    return undefined;
  }

  const selected = options.find((option) => option.value === currentValue);
  if (!selected) {
    return undefined;
  }

  if (!selected.disabled) {
    return selected.value;
  }

  const enabled = options.filter((option) => !option.disabled);
  return enabled[0]?.value;
}

export function resolveComboboxInputValue(
  selectedValue: string | undefined,
  options: Array<ComboboxOption>,
  placeholder = "",
) {
  if (selectedValue === undefined) {
    return placeholder;
  }

  const selected = options.find((option) => option.value === selectedValue && !option.disabled);
  if (!selected) {
    return placeholder;
  }

  return selected.textValue;
}

export function filterComboboxOptions(
  options: Array<ComboboxOption>,
  query: string,
  filterFn: ComboboxFilterFn = defaultComboboxFilter,
) {
  return options.filter((option) => filterFn(option.textValue, query));
}
