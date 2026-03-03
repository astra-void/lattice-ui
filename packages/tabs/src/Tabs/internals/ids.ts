function sanitizeValue(value: string) {
  const lowered = string.lower(value);
  const sanitized = string.gsub(lowered, "[^%w_%-]", "-")[0];
  return sanitized.size() > 0 ? sanitized : "tab";
}

export function createTabsTriggerName(value: string) {
  return `TabsTrigger:${sanitizeValue(value)}`;
}

export function createTabsContentName(value: string) {
  return `TabsContent:${sanitizeValue(value)}`;
}
