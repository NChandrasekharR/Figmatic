import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { EmptyState } from './EmptyState';
import { FramePreview } from './FramePreview';
import { LoadingState } from './LoadingState';
import { CritiqueResults } from './CritiqueResults';
import { analyzewithAnthropic } from '../../llm/anthropic';

export function MainView() {
  const {
    config,
    selectedFrame,
    status,
    screenshot,
    frameData,
    critique,
    error,
    setView,
    setStatus,
    setCritique,
    setError,
    reset,
  } = useAppStore();

  // Run analysis when we have screenshot and frameData
  useEffect(() => {
    if (status === 'analyzing' && screenshot && frameData && config) {
      analyzewithAnthropic(
        config.apiKey,
        config.model,
        screenshot,
        frameData
      )
        .then((result) => {
          setCritique(result);
        })
        .catch((err) => {
          setError(err.message || 'Analysis failed');
        });
    }
  }, [status, screenshot, frameData, config, setCritique, setError]);

  const handleAnalyze = () => {
    if (!selectedFrame) return;
    reset();
    setStatus('capturing');
    parent.postMessage(
      { pluginMessage: { type: 'analyze', frameId: selectedFrame.id } },
      '*'
    );
  };

  const handleGoToLayer = (nodeId: string) => {
    parent.postMessage(
      { pluginMessage: { type: 'go-to-layer', nodeId } },
      '*'
    );
  };

  const isLoading = status === 'capturing' || status === 'extracting' || status === 'analyzing';

  return (
    <div className="app">
      <div className="header">
        <h1>Figmatic</h1>
        <button
          className="settings-btn"
          onClick={() => setView('settings')}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* No frame selected */}
      {!selectedFrame && <EmptyState />}

      {/* Frame selected */}
      {selectedFrame && !isLoading && !critique && (
        <div className="frame-preview">
          <FramePreview frame={selectedFrame} />
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" onClick={handleAnalyze}>
            Analyze Design
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingState status={status} />}

      {/* Results */}
      {critique && (
        <CritiqueResults
          critique={critique}
          onGoToLayer={handleGoToLayer}
          onReanalyze={handleAnalyze}
        />
      )}
    </div>
  );
}
