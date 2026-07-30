import type { Claim, Issue, NounPhrase } from './types.js';


function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/s$/, ''); 
}

interface AntecedentEntry {
  normalized: string;
  originalText: string;
  introducedInClaim: number;
}


function buildAncestorChain(claim: Claim, byNumber: Map<number, Claim>): Claim[] {
  const chain: Claim[] = [];
  let current: Claim | undefined = claim;
  const seen = new Set<number>();

  while (current?.parent !== undefined) {
    if (seen.has(current.parent)) break; // guard against accidental cycles
    seen.add(current.parent);
    const parent = byNumber.get(current.parent);
    if (!parent) break;
    chain.push(parent);
    current = parent;
  }
  return chain;
}

function collectIntroducedAntecedents(claim: Claim): AntecedentEntry[] {
  const entries: AntecedentEntry[] = [];
  for (const el of claim.elements) {
    for (const np of el.nounPhrases) {
      if (np.determiner === 'a' || np.determiner === 'an') {
        entries.push({
          normalized: normalize(np.text),
          originalText: np.text,
          introducedInClaim: claim.number,
        });
      }
    }
  }
  return entries;
}

export function validateClaimSet(claims: Claim[]): Issue[] {
  const issues: Issue[] = [];
  const byNumber = new Map(claims.map((c) => [c.number, c]));

  for (const claim of claims) {
    // --- Broken / forward reference checks ---
    if (claim.type === 'dependent' && claim.parent !== undefined) {
      const parentExists = byNumber.has(claim.parent);
      if (!parentExists) {
        issues.push({
          claimNumber: claim.number,
          severity: 'error',
          code: 'BROKEN_REFERENCE',
          message: `Claim ${claim.number} depends on claim ${claim.parent}, which does not exist.`,
          span: [claim.offset, claim.offset + claim.rawText.length],
        });
        continue; 
      }
      if (claim.parent >= claim.number) {
        issues.push({
          claimNumber: claim.number,
          severity: 'error',
          code: 'FORWARD_REFERENCE',
          message: `Claim ${claim.number} depends on claim ${claim.parent}, which is not an earlier claim.`,
          span: [claim.offset, claim.offset + claim.rawText.length],
        });
        continue;
      }
    }

    // --- Build inherited antecedent table ---
    const ancestors = buildAncestorChain(claim, byNumber);
    const inherited = ancestors.flatMap(collectIntroducedAntecedents);
    const ownIntroduced = collectIntroducedAntecedents(claim);
    const availableBeforeThisPoint = new Set(
      [...inherited].map((e) => e.normalized)
    );


    const introducedSoFar = new Set(availableBeforeThisPoint);

    for (const el of claim.elements) {
      for (const np of el.nounPhrases) {
        const norm = normalize(np.text);

        if (np.determiner === 'the' || np.determiner === 'said') {
          if (!introducedSoFar.has(norm)) {
            issues.push({
              claimNumber: claim.number,
              severity: 'error',
              code: 'MISSING_ANTECEDENT',
              message: `"${np.text}" lacks antecedent basis — no prior "a/an ${stripDeterminer(np.text)}" found in claim ${claim.number} or its parent claims.`,
              span: np.span,
            });
          }
        } else if (np.determiner === 'a' || np.determiner === 'an') {
          if (introducedSoFar.has(norm)) {
            issues.push({
              claimNumber: claim.number,
              severity: 'warning',
              code: 'DUPLICATE_ANTECEDENT',
              message: `"${np.text}" is introduced again with "${np.determiner}" — it (or an equivalent term) was already established.`,
              span: np.span,
            });
          }
          introducedSoFar.add(norm);
        }
      }
    }
    void ownIntroduced;
  }

  return issues;
}

function stripDeterminer(text: string): string {
  return text.trim();
}