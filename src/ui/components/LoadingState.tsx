interface Props {
  status: 'capturing' | 'extracting' | 'analyzing';
}

const STATUS_TEXT = {
  capturing: 'Capturing screenshot...',
  extracting: 'Extracting design data...',
  analyzing: 'Analyzing with Claude...',
};

export function LoadingState({ status }: Props) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>{STATUS_TEXT[status]}</p>
    </div>
  );
}
