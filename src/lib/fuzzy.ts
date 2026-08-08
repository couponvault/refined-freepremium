/** Lightweight typo-tolerant matching (no extra deps). */

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 4) return Math.max(a.length, b.length);

  const rows = a.length + 1;
  const cols = b.length + 1;
  let prev = new Array<number>(cols);
  let curr = new Array<number>(cols);
  for (let j = 0; j < cols; j++) prev[j] = j;

  for (let i = 1; i < rows; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j < cols; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** 0–1 similarity for a single token pair. */
export function tokenSimilarity(query: string, target: string): number {
  if (!query || !target) return 0;
  if (query === target) return 1;
  if (target.startsWith(query) || query.startsWith(target)) return 0.92;
  if (target.includes(query) || query.includes(target)) return 0.85;

  const maxLen = Math.max(query.length, target.length);
  if (!maxLen) return 0;
  const dist = levenshtein(query, target);
  const allowed =
    query.length <= 3 ? 1 : query.length <= 6 ? 2 : query.length <= 10 ? 3 : 4;
  if (dist > allowed) return 0;
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Score how well `query` matches `text`.
 * Higher = better. 0 = no useful match.
 */
export function fuzzyScore(query: string, text: string): number {
  const qn = normalizeText(query);
  const tn = normalizeText(text);
  if (!qn || !tn) return 0;

  if (tn === qn) return 200;
  if (tn.startsWith(qn)) return 160;
  if (tn.includes(qn)) return 130;

  const qTokens = qn.split(" ").filter(Boolean);
  const tTokens = tn.split(" ").filter(Boolean);
  if (!qTokens.length || !tTokens.length) return 0;

  let score = 0;
  let matched = 0;
  for (const qt of qTokens) {
    let best = 0;
    for (const tt of tTokens) {
      best = Math.max(best, tokenSimilarity(qt, tt));
    }
    if (best >= 0.55) {
      matched += 1;
      score += best * 40;
    }
  }

  if (matched === 0) return 0;
  if (qTokens.length > 1 && matched < Math.ceil(qTokens.length * 0.5)) {
    return 0;
  }
  // Prefer covering more of the query
  score += (matched / qTokens.length) * 20;
  return score;
}

export function fuzzyRank<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  opts?: { limit?: number; minScore?: number }
): T[] {
  const minScore = opts?.minScore ?? 40;
  const limit = opts?.limit ?? 50;
  const q = query.trim();
  if (!q) return items.slice(0, limit);

  return items
    .map((item) => ({ item, score: fuzzyScore(q, getText(item)) }))
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}
