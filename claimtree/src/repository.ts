import { db } from './db.js';
import type { Claim, Issue } from './types.js';

export interface ClaimSetRecord {
  id: number;
  rawText: string;
  createdAt: string;
}

export function saveClaimSet(rawText: string, claims: Claim[], issues: Issue[]): number {
  const insertSet = db.prepare(`INSERT INTO claim_sets (raw_text) VALUES (?)`);
  const insertClaim = db.prepare(`
    INSERT INTO claims (claim_set_id, number, type, parent, preamble, offset, raw_text, elements_json)
    VALUES (@claimSetId, @number, @type, @parent, @preamble, @offset, @rawText, @elementsJson)
  `);
  const insertIssue = db.prepare(`
    INSERT INTO issues (claim_set_id, claim_number, severity, code, message, span_start, span_end)
    VALUES (@claimSetId, @claimNumber, @severity, @code, @message, @spanStart, @spanEnd)
  `);

  const tx = db.transaction(() => {
    const { lastInsertRowid } = insertSet.run(rawText);
    const claimSetId = Number(lastInsertRowid);

    for (const c of claims) {
      insertClaim.run({
        claimSetId,
        number: c.number,
        type: c.type,
        parent: c.parent ?? null,
        preamble: c.preamble,
        offset: c.offset,
        rawText: c.rawText,
        elementsJson: JSON.stringify(c.elements),
      });
    }

    for (const i of issues) {
      insertIssue.run({
        claimSetId,
        claimNumber: i.claimNumber,
        severity: i.severity,
        code: i.code,
        message: i.message,
        spanStart: i.span[0],
        spanEnd: i.span[1],
      });
    }

    return claimSetId;
  });

  return tx();
}

export function getClaimSet(id: number): ClaimSetRecord | undefined {
  return db
    .prepare(`SELECT id, raw_text as rawText, created_at as createdAt FROM claim_sets WHERE id = ?`)
    .get(id) as ClaimSetRecord | undefined;
}

export function getClaimsForSet(claimSetId: number): Claim[] {
  const rows = db
    .prepare(`SELECT * FROM claims WHERE claim_set_id = ? ORDER BY number ASC`)
    .all(claimSetId) as any[];

  return rows.map((r) => ({
    number: r.number,
    type: r.type,
    parent: r.parent ?? undefined,
    preamble: r.preamble,
    offset: r.offset,
    rawText: r.raw_text,
    elements: JSON.parse(r.elements_json),
  }));
}

export function getIssuesForSet(claimSetId: number): Issue[] {
  const rows = db
    .prepare(`SELECT * FROM issues WHERE claim_set_id = ? ORDER BY claim_number ASC`)
    .all(claimSetId) as any[];

  return rows.map((r) => ({
    claimNumber: r.claim_number,
    severity: r.severity,
    code: r.code,
    message: r.message,
    span: [r.span_start, r.span_end] as [number, number],
  }));
}