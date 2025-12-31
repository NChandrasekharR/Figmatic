interface Props {
  status: 'capturing' | 'extracting' | 'analyzing';
  modelName?: string;
}

const STEPS = [
  { key: 'capturing', label: 'Capturing screenshot' },
  { key: 'extracting', label: 'Extracting design data' },
  { key: 'analyzing', label: 'Analyzing with AI' },
] as const;

export function LoadingState({ status, modelName }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="loading-state">
      <div className="spinner" />
      <div className="loading-steps">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          let label = step.label;
          if (step.key === 'analyzing' && modelName) {
            label = `Analyzing with ${modelName}`;
          }

          return (
            <div
              key={step.key}
              className={`loading-step ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <span className="step-icon">
                {isComplete ? '✓' : isCurrent ? '●' : '○'}
              </span>
              <span className="step-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
