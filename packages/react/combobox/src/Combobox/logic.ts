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

/** Values the highlight may land on: enabled options that match the current query. */
export function getNavigableComboboxValues(
  options: Array<ComboboxOption>,
  query: string,
  filterFn: ComboboxFilterFn = defaultComboboxFilter,
) {
  return options
    .filter((option) => !option.disabled && filterFn(option.textValue, query))
    .map((option) => option.value);
}

/** Steps the highlight through the navigable values, wrapping at either end. */
export function moveComboboxHighlight(navigable: Array<string>, current: string | undefined, step: -1 | 1) {
  const count = navigable.size();
  if (count === 0) {
    return undefined;
  }

  const currentIndex = current !== undefined ? navigable.indexOf(current) : -1;
  if (currentIndex === -1) {
    return step > 0 ? navigable[0] : navigable[count - 1];
  }

  return navigable[(currentIndex + step + count) % count];
}

/**
 * Keeps the highlight on a navigable value as the query and item set change: the current highlight
 * if it still matches, else the selected value, else the first match while the user is filtering.
 */
export function resolveComboboxHighlight(
  navigable: Array<string>,
  current: string | undefined,
  selected: string | undefined,
  query: string,
) {
  if (current !== undefined && navigable.includes(current)) {
    return current;
  }

  if (selected !== undefined && navigable.includes(selected)) {
    return selected;
  }

  return query !== "" ? navigable[0] : undefined;
}
