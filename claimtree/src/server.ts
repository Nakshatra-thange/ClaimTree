import Fastify from 'fastify';
import { parseClaimSet, validateClaimSet } from './index.js';
import {
  saveClaimSet,
  getClaimSet,
  getClaimsForSet,
  getIssuesForSet,
} from './repository.js';
import { suggestFix } from './suggestFix.js';


export function buildServer() {
  const app = Fastify({ logger: true });

  // POST /claims/parse  { text: string } -> { claimSetId, claims, issues }
  app.post('/claims/parse', async (req, reply) => {
    const body = req.body as { text?: string };
    if (!body?.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
      return reply.code(400).send({ error: 'Body must include non-empty "text" string.' });
    }

    let claims;
    try {
      claims = parseClaimSet(body.text);
    } catch (err) {
      return reply.code(422).send({ error: (err as Error).message });
    }

    const issues = validateClaimSet(claims);
    const claimSetId = saveClaimSet(body.text, claims, issues);

    return reply.code(201).send({ claimSetId, claims, issues });
  });

  // POST /claims/validate  { claimSetId: number } -> { issues }
  // Re-runs validation against a stored claim set (useful once Part 2's rules evolve
  // without needing to re-parse from raw text).
  app.post('/claims/validate', async (req, reply) => {
    const body = req.body as { claimSetId?: number };
    if (!body?.claimSetId) {
      return reply.code(400).send({ error: 'Body must include "claimSetId".' });
    }

    const set = getClaimSet(body.claimSetId);
    if (!set) return reply.code(404).send({ error: 'claim set not found' });

    const claims = getClaimsForSet(body.claimSetId);
    const issues = validateClaimSet(claims);

    return reply.send({ claimSetId: body.claimSetId, issues });
  });

  // GET /claims/:id/tree -> { claimSetId, rawText, claims, issues }
  app.get('/claims/:id/tree', async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    if (Number.isNaN(id)) return reply.code(400).send({ error: 'Invalid id' });

    const set = getClaimSet(id);
    if (!set) return reply.code(404).send({ error: 'claim set not found' });

    const claims = getClaimsForSet(id);
    const issues = getIssuesForSet(id);

    return reply.send({ claimSetId: id, rawText: set.rawText, claims, issues });
  });

 
  app.post('/claims/suggest-fix', async (req, reply) => {
    const body = req.body as { claimSetId?: number; claimNumber?: number };
    if (!body?.claimSetId || body.claimNumber === undefined) {
      return reply.code(400).send({ error: 'Body must include claimSetId and claimNumber.' });
    }

    const claims = getClaimsForSet(body.claimSetId);
    const claim = claims.find((c) => c.number === body.claimNumber);
    if (!claim) return reply.code(404).send({ error: 'claim not found' });

    const issues = getIssuesForSet(body.claimSetId).filter(
      (i) => i.claimNumber === body.claimNumber
    );
    if (issues.length === 0) {
      return reply.code(400).send({ error: 'no issues found for this claim; nothing to fix' });
    }

    try {
      const suggestion = await suggestFix(issues[0], claim.rawText);
      return reply.send({ claimNumber: claim.number, issue: issues[0], suggestion });
    } catch (err) {
      req.log.error(err);
      return reply.code(502).send({ error: 'LLM suggestion failed', detail: (err as Error).message });
    }
  });

  app.get('/health', async () => ({ ok: true }));

  return app;
}

async function main() {
  const app = buildServer();
  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });
}

// Only auto-start when run directly (not when imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}