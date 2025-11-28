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

export function SetupScreen() {
  const { config } = useAppStore();

  const [provider] = useState<'anthropic'>('anthropic');
  const [model, setModel] = useState(config?.model || MODELS.anthropic[0].id);
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const isValid = await validateAnthropicKey(apiKey.trim());

      if (!isValid) {
        setError('Invalid API key. Please check and try again.');
        setValidating(false);
        return;
      }

      const newConfig: PluginConfig = {
        provider,
        model,
        apiKey: apiKey.trim(),
      };

      parent.postMessage(
        { pluginMessage: { type: 'save-config', config: newConfig } },
        '*'
      );
    } catch (err) {
      setError('Failed to validate key. Check your connection.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="app">
      <div className="setup-screen">
        <div>
          <h1>Figmatic</h1>
          <p>Get AI-powered UX feedback on your Figma designs.</p>
        </div>

        <div className="form-group">
          <label>AI Provider</label>
          <select value={provider} disabled>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
          <span className="hint">More providers coming soon</span>
        </div>

        <div className="form-group">
          <label>Model</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.anthropic.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
          />
          <span className="hint">
            Your key is stored locally and never sent to us.
            <br />
            Get one at{' '}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener"
              style={{ color: '#0066ff' }}
            >
              console.anthropic.com
            </a>
          </span>
        </div>

        {error && <div className="error">{error}</div>}

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={validating || !apiKey.trim()}
        >
          {validating ? 'Validating...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}
