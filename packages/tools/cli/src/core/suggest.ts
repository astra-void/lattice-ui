/**
 * Levenshtein distance, capped implicitly by the caller's threshold.
 *
 * Two rolling rows instead of a full matrix; the inputs here are command and component names, so
 * the allocation matters less than keeping the function obvious.
 */
function editDistance(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      current[rightIndex] = Math.min(current[rightIndex - 1] + 1, previous[rightIndex] + 1, substitution);
    }

    previous = current;
  }

  return previous[right.length];
}

/**
 * Picks the closest candidates to `input`, nearest first.
 *
 * The threshold scales with the input length so short names ("add") only match near-identical
 * typos while longer ones ("context-menu") tolerate a couple of slips.
 */
export function suggestClosest(input: string, candidates: readonly string[], limit = 3): string[] {
  const normalized = input.toLowerCase();
  const threshold = Math.max(1, Math.floor(normalized.length / 3) + 1);

  return candidates
    .map((candidate) => ({ candidate, distance: editDistance(normalized, candidate.toLowerCase()) }))
    .filter((entry) => entry.distance <= threshold)
    .sort((left, right) => left.distance - right.distance || left.candidate.localeCompare(right.candidate))
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/** Renders a `Did you mean ...?` hint, or nothing when no candidate is close enough. */
export function didYouMean(input: string, candidates: readonly string[]): string | undefined {
  const matches = suggestClosest(input, candidates);
  if (matches.length === 0) {
    return undefined;
  }

  return `Did you mean ${matches.map((match) => `\`${match}\``).join(" or ")}?`;
}
