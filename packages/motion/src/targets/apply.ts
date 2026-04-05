export function applyMotionProperties(instance: Instance, properties?: Record<string, unknown>) {
  if (!properties) return;
  for (const [key, value] of pairs(properties)) {
    if (typeIs(key, "string")) {
      (instance as unknown as Record<string, unknown>)[key] = value;
    }
  }
}
