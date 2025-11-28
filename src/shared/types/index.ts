// Frame and hierarchy types
export interface FrameInfo {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface HierarchyNode {
  id: string;
  name: string;
  type: string;
  path: string;
  depth: number;
  visible: boolean;
  children?: HierarchyNode[];
  width?: number;
  height?: number;
}

export interface ColorUsage {
  hex: string;
  count: number;
  usages: Array<{
    nodeId: string;
    nodeName: string;
    type: 'fill' | 'stroke';
  }>;
}

export interface TypographyUsage {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number | 'auto';
  count: number;
  nodeIds: string[];
}

export interface FrameAnalysis {
  name: string;
  dimensions: { width: number; height: number };
  hierarchy: HierarchyNode;
  layerCount: number;
  colors: ColorUsage[];
  typography: TypographyUsage[];
  hasAutoLayout: boolean;
  componentCount: number;
}

// Critique types
export interface CritiqueIssue {
  severity: 'critical' | 'warning' | 'suggestion';
  category: 'hierarchy' | 'spacing' | 'typography' | 'color' | 'accessibility' | 'consistency';
  element: string;
  elementId?: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface CritiqueResult {
  summary: string;
  score: number;
  issues: CritiqueIssue[];
  strengths: string[];
  priorities: string[];
}

// Config types
export interface PluginConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  apiKey: string;
}

// Message types between plugin and UI
export type PluginMessage =
  | { type: 'config'; config: PluginConfig | null }
  | { type: 'frame-selected'; frame: FrameInfo }
  | { type: 'no-frame-selected' }
  | { type: 'status'; status: 'capturing' | 'extracting' | 'analyzing' }
  | { type: 'ready-for-analysis'; screenshot: string; frameData: FrameAnalysis }
  | { type: 'error'; message: string };

export type UIMessage =
  | { type: 'get-config' }
  | { type: 'save-config'; config: PluginConfig }
  | { type: 'analyze'; frameId: string }
  | { type: 'go-to-layer'; nodeId: string };
