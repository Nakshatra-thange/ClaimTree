import { useState } from 'react';
import { HighlightedText } from './HighlightedText';
import { IssueList } from './IssueList';
import { DependencyTree } from './DependencyTree';
import type { ParseResponse } from './types';

const SAMPLE = `1. A widget comprising:
a housing having an interior surface;
a fastener coupled to the housing; and
a sensor disposed within the interior surface.

2. The widget of claim 1, wherein the fastener is a magnetic fastener.

3. The widget of claim 2, wherein the sensor detects a proximity of the actuator.

4. The widget of claim 7, wherein the housing is metal.`;

export default function App() {
  const [text, setText] = useState(SAMPLE);
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [activeClaim, setActiveClaim] = useState<number | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<Record<number, string>>({});
  const [loadingClaim, setLoadingClaim] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleParse() {
    setBusy(true);
    setSuggestions({});
    try {
      const res = await fetch('/claims/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Parse failed');
      setResult(data);
      setActiveClaim(undefined);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSuggestFix(claimNumber: number) {
    if (!result) return;
    setLoadingClaim(claimNumber);
    try {
      const res = await fetch('/claims/suggest-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimSetId: result.claimSetId, claimNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Suggestion failed');
      setSuggestions((s) => ({ ...s, [claimNumber]: data.suggestion }));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoadingClaim(null);
    }
  }

  const errorCount = result?.issues.filter((i) => i.severity === 'error').length ?? 0;
  const warnCount = result?.issues.filter((i) => i.severity === 'warning').length ?? 0;

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 24px 80px' }}>
      {/* ---- Header ---- */}
      <header style={{ marginBottom: 32 }}>
        <div className="eyebrow">CLAIM_STRUCTURE // ANTECEDENT_BASIS_ENGINE</div>
        <h1
          style={{
            fontSize: 42,
            letterSpacing: '-0.02em',
            margin: '6px 0 8px',
            fontWeight: 600,
          }}
        >
          ClaimTree
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, maxWidth: 560 }}>
          Parses patent claim sets into a structural tree and runs deterministic
          checks — missing antecedent basis, broken dependency references,
          forward references. No model in the critical path.
        </p>
        <hr className="hairline" style={{ marginTop: 24 }} />
      </header>

      {/* ---- Input ---- */}
      <section className="bracket-panel" style={{ marginBottom: 8 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          [ INPUT ] // paste claim set
        </div>
        <textarea
          className="tech-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
        />
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
            {text.trim().length === 0 ? 'awaiting input' : `${text.length} chars`}
          </span>
          <button className="tech-btn" onClick={handleParse} disabled={busy}>
            {busy ? '[ PARSING… ]' : '[ PARSE_AND_VALIDATE ]'}
          </button>
        </div>
      </section>

      {/* ---- Results ---- */}
      {result && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 24,
              margin: '28px 0 20px',
              fontSize: 12,
              color: 'var(--ink-soft)',
            }}
          >
            <span>SET_ID = {result.claimSetId}</span>
            <span>CLAIMS = {result.claims.length}</span>
            <span style={{ color: errorCount ? 'var(--error)' : 'var(--ink-soft)' }}>
              ERRORS = {errorCount}
            </span>
            <span style={{ color: warnCount ? 'var(--warn)' : 'var(--ink-soft)' }}>
              WARNINGS = {warnCount}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
            <div>
              <section className="bracket-panel" style={{ marginBottom: 20 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  [ CLAIM_TEXT ]{activeClaim ? ` // isolating claim ${activeClaim}` : ''}
                </div>
                <HighlightedText
                  text={result.claims.map((c) => c.rawText).join('\n\n')}
                  issues={result.issues}
                />
              </section>

              <section className="bracket-panel">
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  [ DEPENDENCY_TREE ]
                </div>
                <DependencyTree claims={result.claims} onSelect={setActiveClaim} />
              </section>
            </div>

            <section className="bracket-panel" style={{ alignSelf: 'start' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                [ ISSUES ] // {result.issues.length} found
              </div>
              <IssueList
                issues={result.issues}
                onSelectClaim={setActiveClaim}
                onSuggestFix={handleSuggestFix}
                suggestions={suggestions}
                loadingClaim={loadingClaim}
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
}