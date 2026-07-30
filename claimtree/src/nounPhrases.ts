import type { NounPhrase, Determiner } from './types.js';

const DETERMINERS = new Set(['a', 'an', 'the', 'said']);

// Words that signal we've run past the noun phrase into a verb/relational clause.
const STOP_WORDS = new Set([
  'having', 'comprising', 'coupled', 'configured', 'disposed', 'adapted',
  'wherein', 'is', 'are', 'for', 'to', 'of', 'with', 'within', 'between',
  'and', 'or', 'that', 'which', 'when', 'being', 'includes', 'including',
  'connected', 'attached', 'operable', 'arranged',
]);

const PHRASE_START =
  /\b(a|an|the|said)\s+([a-zA-Z-]+(?:\s+[a-zA-Z-]+){0,4}?)(?=\s+(?:having|comprising|coupled|configured|disposed|adapted|wherein|is|are|for|to|of|with|within|between|and|or|that|which|when|being|includes|including|connected|attached|operable|arranged)\b|[.,;:]|$)/gi;

/**
 * @param text local text of a single claim element
 * @param baseOffset absolute offset of `text[0]` within the full source document
 */
export function extractNounPhrases(text: string, baseOffset: number): NounPhrase[] {
  const phrases: NounPhrase[] = [];
  const re = new RegExp(PHRASE_START);
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const determiner = match[1].toLowerCase() as Determiner;
    if (!DETERMINERS.has(determiner)) continue;

    const words = match[2].trim().split(/\s+/);
    const kept: string[] = [];
    for (const w of words) {
      const clean = w.toLowerCase().replace(/[^a-z-]/g, '');
      if (STOP_WORDS.has(clean)) break;
      kept.push(w);
    }
    if (kept.length === 0) continue;

    const phraseText = kept.join(' ').replace(/[,.;:]+$/, '');
    const fullSpanText = `${match[1]} ${phraseText}`;
    const start = baseOffset + match.index;
    const end = start + fullSpanText.length;

    phrases.push({ text: phraseText, determiner, span: [start, end] });
  }

  return phrases;
}