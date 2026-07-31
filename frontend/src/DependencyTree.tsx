import type { Claim } from './types';

export function DependencyTree({ claims, onSelect }: { claims: Claim[]; onSelect: (n: number) => void }) {
  const roots = claims.filter((c) => c.type === 'independent');

  function renderNode(claim: Claim, depth: number) {
    const children = claims.filter((c) => c.parent === claim.number);
    return (
      <div key={claim.number} style={{ marginLeft: depth * 18 }}>
        <div
          style={{
            cursor: 'pointer',
            padding: '3px 0',
            fontSize: 13,
            color: depth === 0 ? 'var(--ink)' : 'var(--ink-soft)',
          }}
          onClick={() => onSelect(claim.number)}
        >
          {depth > 0 ? '└─ ' : ''}CLAIM_{claim.number}
          {claim.type === 'independent' ? '  [independent]' : ''}
        </div>
        {children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  }

  return <div>{roots.map((r) => renderNode(r, 0))}</div>;
}