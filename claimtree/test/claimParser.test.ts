import { describe, it, expect } from 'vitest';
import { parseClaimSet } from '../src/index.js';

describe('parseClaimSet', () => {
  it('parses independent and dependent claims with correct parent linkage', () => {
    const claims = parseClaimSet(`
1. A widget comprising a housing.
2. The widget of claim 1, wherein the housing is metal.
`);
    expect(claims).toHaveLength(2);
    expect(claims[0].type).toBe('independent');
    expect(claims[1].type).toBe('dependent');
    expect(claims[1].parent).toBe(1);
  });

  it('extracts noun phrases with determiners', () => {
    const claims = parseClaimSet('1. A widget comprising a housing and the fastener.');
    const allPhrases = claims[0].elements.flatMap((e) => e.nounPhrases);
    const determiners = allPhrases.map((p) => p.determiner);
    expect(determiners).toContain('a');
    expect(determiners).toContain('the');
  });
});