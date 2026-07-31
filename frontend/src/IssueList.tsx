import type { Issue } from './types';

interface Props {
  issues: Issue[];
  onSelectClaim: (claimNumber: number) => void;
  onSuggestFix: (claimNumber: number) => void;
  suggestions: Record<number, string>;
  loadingClaim: number | null;
}

export function IssueList({ issues, onSelectClaim, onSuggestFix, suggestions, loadingClaim }: Props) {
  if (issues.length === 0) {
    return <p style={{ color: 'var(--accent)', fontSize: 13 }}>// no issues detected</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {issues.map((issue, i) => (
        <li
          key={i}
          style={{
            borderLeft: `2px solid ${issue.severity === 'error' ? 'var(--error)' : 'var(--warn)'}`,
            paddingLeft: 10,
            marginBottom: 14,
            cursor: 'pointer',
          }}
          onClick={() => onSelectClaim(issue.claimNumber)}
        >
          <div style={{ fontSize: 11, letterSpacing: '0.04em', color: 'var(--ink-soft)' }}>
            CLAIM_{issue.claimNumber} · {issue.code}
          </div>
          <div style={{ fontSize: 13, margin: '4px 0 6px' }}>{issue.message}</div>
          <button
            className="tech-btn-ghost"
            disabled={loadingClaim === issue.claimNumber}
            onClick={(e) => {
              e.stopPropagation();
              onSuggestFix(issue.claimNumber);
            }}
          >
            {loadingClaim === issue.claimNumber ? '[ THINKING… ]' : '[ SUGGEST_FIX ]'}
          </button>
          {suggestions[issue.claimNumber] && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                background: 'var(--accent-bg)',
                border: '1px solid var(--line)',
                padding: 8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {suggestions[issue.claimNumber]}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}