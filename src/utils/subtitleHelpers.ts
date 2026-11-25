const SUBTITLE_STOP_WORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'untuk', 'pada', 'dengan', 'adalah', 'atau',
  'juga', 'kalau', 'jika', 'jadi', 'karena', 'agar', 'supaya', 'bisa', 'akan', 'sudah', 'belum',
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'it', 'for', 'that', 'this', 'with', 'on', 'at',
]);

export function stripSubtitleWordPunct(word: string): string {
  return String(word || '').replace(/^[^\w\u00C0-\u024F]+|[^\w\u00C0-\u024F]+$/g, '');
}

export function pickBestHighlightWordClient(
  textOrWords: string | string[],
  preferredWord?: string
): string {
  const rawTokens = Array.isArray(textOrWords)
    ? textOrWords.map((w) => String(w || '').trim()).filter(Boolean)
    : String(textOrWords || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

  if (rawTokens.length === 0) return '';

  const fullText = rawTokens.join(' ');
  const prefRaw = String(preferredWord || '').trim();
  if (prefRaw) {
    const escaped = prefRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactSubMatch = fullText.match(new RegExp(escaped, 'i'));
    if (exactSubMatch && exactSubMatch[0]) {
      return exactSubMatch[0];
    }

    const prefClean = stripSubtitleWordPunct(prefRaw.split(/\s+/)[0] || '').toLowerCase();
    if (prefClean) {
      for (const tok of rawTokens) {
        if (stripSubtitleWordPunct(tok).toLowerCase() === prefClean) {
          return stripSubtitleWordPunct(tok) || tok;
        }
      }
      if (prefClean.length >= 3) {
        for (const tok of rawTokens) {
          const cleanTok = stripSubtitleWordPunct(tok).toLowerCase();
          if (cleanTok && (cleanTok.includes(prefClean) || prefClean.includes(cleanTok))) {
            return stripSubtitleWordPunct(tok) || tok;
          }
        }
      }
    }
  }

  let bestWord = stripSubtitleWordPunct(rawTokens[rawTokens.length - 1]) || rawTokens[rawTokens.length - 1] || rawTokens[0];
  let bestScore = -1;

  for (const tok of rawTokens) {
    const clean = stripSubtitleWordPunct(tok);
    if (!clean) continue;
    const lower = clean.toLowerCase();
    const isUpperKey = clean.length >= 2 && clean === clean.toUpperCase() && /[A-Z\u00C0-\u024F]/.test(clean);
    const hasDigit = /\d/.test(clean);
    const score =
      clean.length +
      (clean.length >= 4 ? 4 : 0) +
      (isUpperKey ? 4 : 0) +
      (hasDigit ? 4 : 0) +
      (SUBTITLE_STOP_WORDS.has(lower) ? 0 : 3);

    if (score > bestScore) {
      bestScore = score;
      bestWord = clean;
    }
  }

  return bestWord || rawTokens[0] || '';
}
