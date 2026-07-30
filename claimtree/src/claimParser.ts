import type { Claim, ClaimElement } from './types.js';
import type { ClaimBlock } from './tokenizer.js';
import { splitClaimSet } from './tokenizer.js';
import { extractNounPhrases } from './nounPhrases.js';

const DEPENDENT_REF = /\b(?:of|as recited in|according to)\s+claim\s+(\d+)/i;
const TRANSITION = /\b(comprising|consisting of|consisting essentially of)\b\s*:?/i;
const ELEMENT_BOUNDARY = /;\s*(?:and\s+)?|\bwherein\b\s*/gi;

function detectDependency(text: string): { type: Claim['type']; parent?: number } {
  const m = text.match(DEPENDENT_REF);
  if (m) return { type: 'dependent', parent: parseInt(m[1], 10) };
  return { type: 'independent' };
}

function splitPreambleAndBody(
  text: string,
  type: Claim['type']
): { preamble: string; bodyStart: number } {
  if (type === 'independent') {
    const m = text.match(TRANSITION);
    if (m && m.index !== undefined) {
      return { preamble: text.slice(0, m.index).trim(), bodyStart: m.index + m[0].length };
    }
    return { preamble: text.trim(), bodyStart: text.length };
  }

  const refMatch = text.match(DEPENDENT_REF);
  const searchFrom = refMatch && refMatch.index !== undefined
    ? refMatch.index + refMatch[0].length
    : 0;
  const commaIdx = text.indexOf(',', searchFrom);
  if (commaIdx !== -1) {
    return { preamble: text.slice(0, commaIdx).trim(), bodyStart: commaIdx + 1 };
  }
  return { preamble: text.trim(), bodyStart: text.length };
}

function splitIntoElements(bodyText: string, bodyAbsOffset: number): ClaimElement[] {
  const boundaries: number[] = [];
  const re = new RegExp(ELEMENT_BOUNDARY);
  let match: RegExpExecArray | null;
  while ((match = re.exec(bodyText)) !== null) {
    boundaries.push(match.index + match[0].length);
    if (match.index === re.lastIndex) re.lastIndex++;
  }

  const cutPoints = [0, ...boundaries, bodyText.length];
  const elements: ClaimElement[] = [];

  for (let i = 0; i < cutPoints.length - 1; i++) {
    const start = cutPoints[i];
    const end = cutPoints[i + 1];
    const raw = bodyText.slice(start, end);
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;

    const leadingWs = raw.length - raw.trimStart().length;
    const absStart = bodyAbsOffset + start + leadingWs;

    elements.push({
      id: `el-${i}`,
      text: trimmed,
      span: [absStart, absStart + trimmed.length],
      nounPhrases: extractNounPhrases(trimmed, absStart),
    });
  }

  return elements;
}

function parseClaim(block: ClaimBlock): Claim {
  const { number, text, offset } = block;
  const { type, parent } = detectDependency(text);
  const { preamble, bodyStart } = splitPreambleAndBody(text, type);
  const bodyText = text.slice(bodyStart);
  const elements = splitIntoElements(bodyText, offset + bodyStart);

  return { number, type, parent, preamble, elements, rawText: text, offset };
}

export function parseClaimSet(rawText: string): Claim[] {
  return splitClaimSet(rawText).map(parseClaim);
}