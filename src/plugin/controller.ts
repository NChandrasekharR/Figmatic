import { extractFrameData } from './extractors';
import type { FrameInfo, PluginConfig, UIMessage, PluginMessage } from '../shared/types';

// Show UI
figma.showUI(__html__, { width: 420, height: 640 });

// Helper to post messages to UI
function postMessage(msg: PluginMessage) {
  figma.ui.postMessage(msg);
}

// Get frame info for UI
function getFrameInfo(frame: FrameNode): FrameInfo {
  return {
    id: frame.id,
    name: frame.name,
    width: Math.round(frame.width),
    height: Math.round(frame.height),
  };
}

// Check and report current selection
function checkSelection() {
  const selection = figma.currentPage.selection;

  if (selection.length === 1 && selection[0].type === 'FRAME') {
    const frame = selection[0] as FrameNode;
    postMessage({ type: 'frame-selected', frame: getFrameInfo(frame) });
  } else {
    postMessage({ type: 'no-frame-selected' });
  }
}

// Capture screenshot as base64
async function captureScreenshot(frame: FrameNode): Promise<string> {
  const maxDimension = 2048;
  const scale = Math.min(2, maxDimension / Math.max(frame.width, frame.height));

  const bytes = await frame.exportAsync({
    format: 'PNG',
    constraint: { type: 'SCALE', value: scale },
  });

  return figma.base64Encode(bytes);
}

// Handle analyze request
async function handleAnalyze(frameId: string) {
  const node = figma.getNodeById(frameId);

  if (!node || node.type !== 'FRAME') {
    postMessage({ type: 'error', message: 'Frame not found' });
    return;
  }

  const frame = node as FrameNode;

  try {
    // 1. Capture screenshot
    postMessage({ type: 'status', status: 'capturing' });
    const screenshot = await captureScreenshot(frame);

    // 2. Extract frame data
    postMessage({ type: 'status', status: 'extracting' });
    const frameData = extractFrameData(frame);

    // 3. Send to UI for LLM analysis
    postMessage({
      type: 'ready-for-analysis',
      screenshot,
      frameData,
    });
  } catch (error) {
    postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Analysis failed',
    });
  }
}

// Handle go to layer
function handleGoToLayer(nodeId: string) {
  const node = figma.getNodeById(nodeId);

  if (node && 'x' in node) {
    figma.currentPage.selection = [node as SceneNode];
    figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
  }
}

// Listen for selection changes
figma.on('selectionchange', checkSelection);

// Listen for UI messages
figma.ui.onmessage = async (msg: UIMessage) => {
  switch (msg.type) {
    case 'get-config':
      const config = await figma.clientStorage.getAsync('config') as PluginConfig | null;
      postMessage({ type: 'config', config });
      break;

    case 'save-config':
      await figma.clientStorage.setAsync('config', msg.config);
      postMessage({ type: 'config', config: msg.config });
      break;

    case 'analyze':
      await handleAnalyze(msg.frameId);
      break;

    case 'go-to-layer':
      handleGoToLayer(msg.nodeId);
      break;
  }
};

// Initial selection check
checkSelection();
