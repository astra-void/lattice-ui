export type AccordionType = "single" | "multiple";

export function normalizeAccordionValue(
  accordionType: AccordionType,
  value: string | Array<string> | undefined,
): Array<string> {
  if (accordionType === "single") {
    if (value === undefined) {
      return [];
    }

    if (typeIs(value, "string")) {
      return value.size() > 0 ? [value] : [];
    }

    return value[0] !== undefined ? [value[0]] : [];
  }

  if (value === undefined) {
    return [];
  }

  if (typeIs(value, "string")) {
    return value.size() > 0 ? [value] : [];
  }

  const deduped: Array<string> = [];
  for (const item of value) {
    if (!deduped.includes(item)) {
      deduped.push(item);
    }
  }

  return deduped;
}

export function nextAccordionValues(
  accordionType: AccordionType,
  currentValues: Array<string>,
  candidateValue: string,
  collapsible: boolean,
): Array<string> {
  const isOpen = currentValues.includes(candidateValue);

  if (accordionType === "single") {
    if (isOpen) {
      return collapsible ? [] : [candidateValue];
    }

    return [candidateValue];
  }

  if (isOpen) {
    return currentValues.filter((value) => value !== candidateValue);
  }

  return [...currentValues, candidateValue];
}
