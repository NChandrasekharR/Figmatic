import type { CritiqueResult, CritiqueIssue } from '../../shared/types';

interface Props {
  critique: CritiqueResult;
  onGoToLayer: (nodeId: string) => void;
  onReanalyze: () => void;
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

function IssueCard({
  issue,
  onGoToLayer,
}: {
  issue: CritiqueIssue;
  onGoToLayer: () => void;
}) {
  return (
    <div className={`issue-card ${issue.severity}`}>
      <h4>{issue.title}</h4>
      <div className="element">{issue.element}</div>
      <p>{issue.description}</p>
      <div className="recommendation">
        <strong>Fix:</strong> {issue.recommendation}
      </div>
      {issue.elementId && (
        <button className="go-to-layer" onClick={onGoToLayer}>
          Go to layer →
        </button>
      )}
    </div>
  );
}

export function CritiqueResults({ critique, onGoToLayer, onReanalyze }: Props) {
  const criticalCount = critique.issues.filter(
    (i) => i.severity === 'critical'
  ).length;
  const warningCount = critique.issues.filter(
    (i) => i.severity === 'warning'
  ).length;
  const suggestionCount = critique.issues.filter(
    (i) => i.severity === 'suggestion'
  ).length;

  const handleCopy = () => {
    const text = formatCritiqueAsText(critique);
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="critique-results">
      <div className="critique-header">
        <h2>{critique.summary}</h2>
        <div className={`score-badge ${getScoreClass(critique.score)}`}>
          {critique.score}
        </div>
      </div>

      <div className="severity-summary">
        {criticalCount > 0 && (
          <span className="severity-pill critical">
            🔴 {criticalCount} Critical
          </span>
        )}
        {warningCount > 0 && (
          <span className="severity-pill warning">
            🟡 {warningCount} Warning{warningCount > 1 ? 's' : ''}
          </span>
        )}
        {suggestionCount > 0 && (
          <span className="severity-pill suggestion">
            💡 {suggestionCount} Suggestion{suggestionCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="issues-list">
        {critique.issues.map((issue, index) => (
          <IssueCard
            key={index}
            issue={issue}
            onGoToLayer={() =>
              issue.elementId && onGoToLayer(issue.elementId)
            }
          />
        ))}
      </div>

      {critique.priorities && critique.priorities.length > 0 && (
        <div className="priorities">
          <h3>Fix These First</h3>
          <ol>
            {critique.priorities.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </div>
      )}

      {critique.strengths.length > 0 && (
        <div className="strengths">
          <h3>What's Working Well</h3>
          <ul>
            {critique.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="critique-actions">
        <button className="btn btn-primary" onClick={onReanalyze}>
          Re-analyze
        </button>
        <button className="btn btn-secondary" onClick={handleCopy}>
          Copy Results
        </button>
      </div>
    </div>
  );
}

function formatCritiqueAsText(critique: CritiqueResult): string {
  const lines = [
    `# UX Critique Results`,
    ``,
    `**Score:** ${critique.score}/100`,
    `**Summary:** ${critique.summary}`,
    ``,
    `## Issues`,
    ``,
  ];

  for (const issue of critique.issues) {
    const icon =
      issue.severity === 'critical'
        ? '🔴'
        : issue.severity === 'warning'
        ? '🟡'
        : '💡';
    lines.push(`### ${icon} ${issue.title}`);
    lines.push(`**Element:** ${issue.element}`);
    lines.push(`**Category:** ${issue.category}`);
    lines.push(`${issue.description}`);
    lines.push(`**Recommendation:** ${issue.recommendation}`);
    lines.push(``);
  }

  if (critique.strengths.length > 0) {
    lines.push(`## Strengths`);
    for (const s of critique.strengths) {
      lines.push(`- ${s}`);
    }
    lines.push(``);
  }

  if (critique.priorities.length > 0) {
    lines.push(`## Top Priorities`);
    for (const p of critique.priorities) {
      lines.push(`- ${p}`);
    }
  }

  return lines.join('\n');
}
