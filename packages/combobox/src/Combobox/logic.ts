export type ComboboxOption = {
  value: string;
  disabled: boolean;
  textValue: string;
};

export type ComboboxFilterFn = (itemText: string, query: string) => boolean;

export function defaultComboboxFilter(itemText: string, query: string) {
  const normalizedItemText = string.lower(itemText);
  const normalizedQuery = string.lower(query);
  return string.find(normalizedItemText, normalizedQuery, 1, true) !== undefined;
}

export function resolveForcedComboboxValue(currentValue: string | undefined, options: Array<ComboboxOption>) {
  const enabled = options.filter((option) => !option.disabled);
  if (enabled.size() === 0) {
    return undefined;
  }

  if (currentValue === undefined) {
    return enabled[0]?.value;
  }

  const selected = enabled.find((option) => option.value === currentValue);
  if (selected) {
    return selected.value;
  }

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
