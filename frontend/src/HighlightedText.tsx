import type { Issue } from './types';

interface Props {
  text: string;
  issues: Issue[];
  activeClaim?: number;
}

export function HighlightedText({ text, issues, activeClaim }: Props) {
  const relevant = activeClaim ? issues.filter((i) => i.claimNumber === activeClaim) : issues;
  const sorted = [...relevant].sort((a, b) => a.span[0] - b.span[0]);

  const segments: { start: number; end: number; issue?: Issue }[] = [];
  let cursor = 0;
  for (const issue of sorted) {
    const [start, end] = issue.span;
    if (start < cursor) continue;
    if (start > cursor) segments.push({ start: cursor, end: start });
    segments.push({ start, end, issue });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ start: cursor, end: text.length });

  return (
    <pre
      style={{
        whiteSpace: 'pre-wrap',
        fontFamily: 'inherit',
        fontSize: 13,
        lineHeight: 1.8,
        margin: 0,
      }}
    >
      {segments.map((seg, i) => {
        const chunk = text.slice(seg.start, seg.end);
        if (!seg.issue) return <span key={i}>{chunk}</span>;
        const color = seg.issue.severity === 'error' ? 'var(--error)' : 'var(--warn)';
        const bg = seg.issue.severity === 'error' ? 'var(--error-bg)' : 'var(--warn-bg)';
        return (
          <span
            key={i}
            title={seg.issue.message}
            style={{
              textDecoration: `underline dotted ${color}`,
              textUnderlineOffset: '4px',
              backgroundColor: bg,
              cursor: 'help',
            }}
          >
            {chunk}
          </span>
        );
      })}
    </pre>
  );
}