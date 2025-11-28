import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { validateAnthropicKey } from '../../llm/anthropic';
import type { PluginConfig } from '../../shared/types';

const MODELS = {
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Recommended)' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Fast & Cheap)' },
  ],
};

export function SettingsView() {
  const { config, setView } = useAppStore();

  const [model, setModel] = useState(config?.model || MODELS.anthropic[0].id);
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setValidating(true);
    setError(null);
    setSaved(false);

    try {
      // Only validate if key changed
      if (apiKey !== config?.apiKey) {
        const isValid = await validateAnthropicKey(apiKey.trim());
        if (!isValid) {
          setError('Invalid API key. Please check and try again.');
          setValidating(false);
          return;
        }
      }

      const newConfig: PluginConfig = {
        provider: 'anthropic',
        model,
        apiKey: apiKey.trim(),
      };

      parent.postMessage(
        { pluginMessage: { type: 'save-config', config: newConfig } },
        '*'
      );

      setSaved(true);
      setTimeout(() => setView('main'), 500);
    } catch (err) {
      setError('Failed to validate key. Check your connection.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Settings</h1>
        <button className="btn btn-secondary" onClick={() => setView('main')}>
          Back
        </button>
      </div>

      <div className="setup-screen">
        <div className="form-group">
          <label>Model</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.anthropic.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <span className="hint">
            Sonnet: Best quality | Haiku: Faster & cheaper
          </span>
        </div>

        <div className="form-group">
          <label>API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={validating || !apiKey.trim()}
        >
          {validating ? 'Validating...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
