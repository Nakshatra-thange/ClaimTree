import { describe, it, expect, beforeAll } from 'vitest';
import { buildServer } from '../src/server.js';
import type { FastifyInstance } from 'fastify';

describe('server routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  it('parses and persists a claim set, returning issues', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/claims/parse',
      payload: {
        text: '1. A widget comprising a housing.\n2. The widget of claim 1, wherein the actuator moves.',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.claimSetId).toBeGreaterThan(0);
    expect(body.claims).toHaveLength(2);
    expect(body.issues.some((i: any) => i.code === 'MISSING_ANTECEDENT')).toBe(true);
  });

  it('fetches a stored claim tree by id', async () => {
    const parseRes = await app.inject({
      method: 'POST',
      url: '/claims/parse',
      payload: { text: '1. A widget comprising a housing.' },
    });
    const { claimSetId } = parseRes.json();

    const treeRes = await app.inject({ method: 'GET', url: `/claims/${claimSetId}/tree` });
    expect(treeRes.statusCode).toBe(200);
    expect(treeRes.json().claims).toHaveLength(1);
  });

  it('returns 400 on empty text', async () => {
    const res = await app.inject({ method: 'POST', url: '/claims/parse', payload: { text: '' } });
    expect(res.statusCode).toBe(400);
  });
});