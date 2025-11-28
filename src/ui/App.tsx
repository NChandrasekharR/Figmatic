import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { SetupScreen } from './components/SetupScreen';
import { MainView } from './components/MainView';
import { SettingsView } from './components/SettingsView';
import type { PluginMessage } from '../shared/types';

export default function App() {
  const {
    config,
    setConfig,
    view,
    setSelectedFrame,
    setStatus,
    setAnalysisData,
    setError,
  } = useAppStore();

  useEffect(() => {
    // Listen for messages from plugin
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as PluginMessage;
      if (!msg) return;

      switch (msg.type) {
        case 'config':
          setConfig(msg.config);
          break;
        case 'frame-selected':
          setSelectedFrame(msg.frame);
          break;
        case 'no-frame-selected':
          setSelectedFrame(null);
          break;
        case 'status':
          setStatus(msg.status);
          break;
        case 'ready-for-analysis':
          setAnalysisData(msg.screenshot, msg.frameData);
          setStatus('analyzing');
          break;
        case 'error':
          setError(msg.message);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial config
    parent.postMessage({ pluginMessage: { type: 'get-config' } }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, [setConfig, setSelectedFrame, setStatus, setAnalysisData, setError]);

  // Show setup screen if no API key configured
  if (!config?.apiKey) {
    return <SetupScreen />;
  }

  // Show settings view
  if (view === 'settings') {
    return <SettingsView />;
  }

  // Main view
  return <MainView />;
}
