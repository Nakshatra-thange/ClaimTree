import { describe, it, expect } from 'vitest';
import { parseClaimSet, validateClaimSet } from '../src/index.js';

describe('validateClaimSet', () => {
  it('flags missing antecedent basis', () => {
    const claims = parseClaimSet(`
1. A widget comprising a housing.
2. The widget of claim 1, wherein the actuator moves.
`);
    const issues = validateClaimSet(claims);
    expect(issues.some((i) => i.code === 'MISSING_ANTECEDENT')).toBe(true);
  });

  it('does not flag properly inherited antecedents', () => {
    const claims = parseClaimSet(`
1. A widget comprising a housing.
2. The widget of claim 1, wherein the housing is metal.
`);
    const issues = validateClaimSet(claims);
    expect(issues).toHaveLength(0);
  });

  it('flags broken and forward references', () => {
    const claims = parseClaimSet(`
1. A widget comprising a housing.
2. The widget of claim 5, wherein the housing is metal.
`);
    const issues = validateClaimSet(claims);
    expect(issues.some((i) => i.code === 'FORWARD_REFERENCE' || i.code === 'BROKEN_REFERENCE')).toBe(true);
  });
});