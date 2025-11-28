# User Stories & End-to-End Implementation

> Detailed walkthrough of Figmatic from user perspective and technical implementation.

---

## Table of Contents

1. [User Personas](#user-personas)
2. [User Stories](#user-stories)
3. [End-to-End Flows](#end-to-end-flows)
4. [Technical Implementation](#technical-implementation)
5. [Error States & Edge Cases](#error-states--edge-cases)

---

## User Personas

### Primary: Solo Designer (Maya)
- Mid-level product designer
- Works on a small team, no dedicated design reviewer
- Wants quick feedback before sharing with stakeholders
- Has OpenAI API key from side projects

### Secondary: Design Lead (James)
- Reviews junior designers' work
- Wants consistent critique criteria across team
- Cares about accessibility compliance
- Company has Anthropic enterprise account

### Tertiary: Developer (Sarah)
- Implements designs from Figma
- Wants to flag UX issues before building
- Prefers local models (privacy, no API costs)
- Uses Ollama

---

## User Stories

### Epic 1: First-Time Setup

#### Story 1.1: Install and Configure
```
AS a designer
I WANT to install the plugin and add my API key
SO THAT I can start getting UX feedback
```

**Acceptance Criteria:**
- [ ] Plugin appears in Figma plugins menu after install
- [ ] First launch shows setup screen (not empty state)
- [ ] Can select provider (OpenAI, Anthropic)
- [ ] Can enter and save API key
- [ ] Key is validated before saving (test API call)
- [ ] Invalid key shows clear error message
- [ ] Key persists across Figma sessions

**Flow:**
```
┌─────────────────────────────────────────────────────────┐
│  Welcome to Figmatic                                    │
│                                                         │
│  Get AI-powered UX feedback on your designs.            │
│                                                         │
│  To get started, choose your AI provider:               │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Anthropic  │  │   OpenAI    │  │   Ollama    │     │
│  │   Claude    │  │    GPT-4    │  │   (Local)   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ API Key: sk-ant-•••••••••••••••••••             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Validate & Save]                                      │
│                                                         │
│  Your key is stored locally and never sent to us.       │
└─────────────────────────────────────────────────────────┘
```

---

#### Story 1.2: Change Provider Later
```
AS a user who already set up the plugin
I WANT to switch to a different AI provider
SO THAT I can try different models or use a cheaper option
```

**Acceptance Criteria:**
- [ ] Settings accessible from main screen (gear icon)
- [ ] Can change provider without losing old key
- [ ] Can have multiple provider keys saved
- [ ] Active provider clearly indicated

---

### Epic 2: Core Critique Flow

#### Story 2.1: Get Critique on Selected Frame
```
AS a designer
I WANT to select a frame and get UX feedback
SO THAT I can improve my design before sharing
```

**Acceptance Criteria:**
- [ ] Plugin detects currently selected frame
- [ ] Shows frame name and thumbnail preview
- [ ] "Analyze" button initiates critique
- [ ] Loading state shows progress
- [ ] Critique displays in structured format
- [ ] Can see issues grouped by severity
- [ ] Each issue shows: title, description, recommendation
- [ ] Total score/summary visible

**Happy Path Flow:**
```
1. User selects frame "Homepage Hero" in Figma
2. Opens Figmatic plugin
3. Plugin shows:
   - Frame preview thumbnail
   - Frame name: "Homepage Hero"
   - Frame dimensions: 1440 x 800
   - [Analyze Design] button

4. User clicks [Analyze Design]
5. Plugin shows loading state:
   - "Capturing screenshot..."
   - "Extracting design data..."
   - "Analyzing with Claude..."

6. Results appear:
   ┌─────────────────────────────────────────┐
   │ Homepage Hero                    78/100 │
   ├─────────────────────────────────────────┤
   │ ⚠️ 2 Critical │ ⚡ 3 Warnings │ 💡 5 Tips │
   ├─────────────────────────────────────────┤
   │                                         │
   │ 🔴 Low contrast on CTA button           │
   │    Ratio: 2.3:1 (needs 4.5:1)          │
   │    → Use #FFFFFF text on this bg       │
   │    [Go to layer]                       │
   │                                         │
   │ 🔴 Touch target too small               │
   │    "Learn More" link is 32x20px        │
   │    → Minimum 44x44px for mobile        │
   │    [Go to layer]                       │
   │                                         │
   │ 🟡 Inconsistent spacing                 │
   │    ...                                  │
   └─────────────────────────────────────────┘
```

---

#### Story 2.2: Navigate to Problem Layer
```
AS a designer reviewing critique
I WANT to click on an issue and jump to that layer
SO THAT I can quickly find and fix the problem
```

**Acceptance Criteria:**
- [ ] Each issue has "Go to layer" action
- [ ] Clicking selects the layer in Figma
- [ ] Figma viewport zooms to show the layer
- [ ] Works for nested layers (deep in hierarchy)
- [ ] Graceful handling if layer was deleted/renamed

**Technical Note:**
```typescript
// Plugin API to select and zoom to node
figma.currentPage.selection = [targetNode];
figma.viewport.scrollAndZoomIntoView([targetNode]);
```

---

#### Story 2.3: No Frame Selected State
```
AS a user who opened the plugin without selecting anything
I WANT clear guidance on what to do
SO THAT I'm not confused by an empty state
```

**Acceptance Criteria:**
- [ ] Shows friendly empty state (not error)
- [ ] Explains what to do: "Select a frame to analyze"
- [ ] Ideally shows recent frames or suggestions
- [ ] Updates automatically when user selects a frame

**UI:**
```
┌─────────────────────────────────────────────┐
│                                             │
│         ┌───────────────────┐               │
│         │    [Frame icon]   │               │
│         └───────────────────┘               │
│                                             │
│      Select a frame to get started          │
│                                             │
│   Click on any frame in your design,        │
│   then come back here to analyze it.        │
│                                             │
└─────────────────────────────────────────────┘
```

---

#### Story 2.4: Re-analyze After Changes
```
AS a designer who just fixed some issues
I WANT to re-run the critique
SO THAT I can verify my fixes worked
```

**Acceptance Criteria:**
- [ ] "Re-analyze" button available after initial critique
- [ ] New critique replaces old one
- [ ] Ideally: diff view showing what improved
- [ ] Score change visible (+5 points, etc.)

---

### Epic 3: Critique Customization

#### Story 3.1: Choose Critique Focus
```
AS a designer
I WANT to focus the critique on specific aspects
SO THAT I get deeper feedback on what matters most
```

**Acceptance Criteria:**
- [ ] Can select critique type before analyzing:
  - Full review (default)
  - Accessibility focus
  - Visual hierarchy focus
  - Spacing & layout focus
  - Mobile usability focus
- [ ] Different prompts used for each type
- [ ] Results emphasize the chosen focus

**UI:**
```
┌─────────────────────────────────────────┐
│ Critique Focus:                         │
│                                         │
│ ○ Full Review                           │
│ ○ Accessibility                         │
│ ○ Visual Hierarchy                      │
│ ○ Spacing & Layout                      │
│ ○ Mobile Usability                      │
│                                         │
│ [Analyze Design]                        │
└─────────────────────────────────────────┘
```

---

#### Story 3.2: Add Context for Better Critique
```
AS a designer
I WANT to provide context about my design
SO THAT the AI gives more relevant feedback
```

**Acceptance Criteria:**
- [ ] Optional text field for context
- [ ] Examples shown as placeholder:
  - "This is a checkout flow for e-commerce"
  - "Target users are seniors 65+"
  - "This is a mobile-first design"
- [ ] Context included in prompt to LLM

---

### Epic 4: Model Selection

#### Story 4.1: Choose Model Within Provider
```
AS a cost-conscious user
I WANT to choose between different models
SO THAT I can balance quality vs cost
```

**Acceptance Criteria:**
- [ ] Model dropdown in settings
- [ ] Shows model name + rough cost indicator
- [ ] For Anthropic: Sonnet (recommended), Haiku (fast/cheap)
- [ ] For OpenAI: GPT-4o (recommended), GPT-4o-mini (fast/cheap)
- [ ] Selection persists

**UI:**
```
┌─────────────────────────────────────────┐
│ Model:                                  │
│ ┌─────────────────────────────────────┐ │
│ │ Claude Sonnet 4           ▼        │ │
│ └─────────────────────────────────────┘ │
│ │ ○ Claude Sonnet 4  ⭐ Best quality  │ │
│ │ ○ Claude Haiku     ⚡ Fast & cheap  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### Epic 5: Results & Actions

#### Story 5.1: Copy Critique as Text
```
AS a designer
I WANT to copy the critique results
SO THAT I can share with my team or add to docs
```

**Acceptance Criteria:**
- [ ] "Copy" button on results
- [ ] Copies as formatted markdown
- [ ] Includes frame name, score, all issues

---

#### Story 5.2: Export Critique Report (Future)
```
AS a design lead
I WANT to export critique as PDF
SO THAT I can include in design reviews
```

*(Marked as future - not MVP)*

---

## End-to-End Flows

### Flow 1: First Use (Complete Journey)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FIRST USE FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ User installs│
    │   plugin     │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Opens plugin │
    │ from menu    │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐     No API key found
    │ Plugin loads │─────────────────────────┐
    └──────┬───────┘                         │
           │                                 ▼
           │                    ┌────────────────────┐
           │                    │   Setup Screen     │
           │                    │   - Select provider│
           │                    │   - Enter API key  │
           │                    └─────────┬──────────┘
           │                              │
           │                              ▼
           │                    ┌────────────────────┐
           │                    │  Validate key      │
           │                    │  (test API call)   │
           │                    └─────────┬──────────┘
           │                              │
           │         ┌────────────────────┼────────────────────┐
           │         │ Invalid           │ Valid              │
           │         ▼                   ▼                    │
           │  ┌─────────────┐    ┌─────────────┐             │
           │  │ Show error  │    │ Save config │             │
           │  │ "Invalid    │    │ to storage  │             │
           │  │  API key"   │    └──────┬──────┘             │
           │  └──────┬──────┘           │                    │
           │         │                  │                    │
           │         ▼                  │                    │
           │  ┌─────────────┐           │                    │
           │  │ Let user    │           │                    │
           │  │ retry       │───────────┘                    │
           │  └─────────────┘                                │
           │                                                 │
           ▼                                                 │
    ┌──────────────┐◀────────────────────────────────────────┘
    │ Main Screen  │
    │ (Frame       │
    │  Selection)  │
    └──────────────┘
```

---

### Flow 2: Critique Flow (Core Loop)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CRITIQUE FLOW                               │
└─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │ User selects    │
    │ frame in Figma  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐      ┌─────────────────────────────────┐
    │ Plugin detects  │      │ Plugin UI shows:                │
    │ selection       │─────▶│ - Frame name                    │
    │ change          │      │ - Thumbnail preview             │
    └─────────────────┘      │ - [Analyze] button              │
                             └───────────────┬─────────────────┘
                                             │
                                             ▼
                             ┌─────────────────────────────────┐
                             │ User clicks [Analyze Design]    │
                             └───────────────┬─────────────────┘
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             │                               │                               │
             ▼                               ▼                               ▼
    ┌─────────────────┐           ┌─────────────────┐            ┌─────────────────┐
    │ 1. CAPTURE      │           │ 2. EXTRACT      │            │ 3. ANALYZE      │
    │    Screenshot   │           │    Frame Data   │            │    with LLM     │
    │                 │           │                 │            │                 │
    │ - Export PNG    │           │ - Hierarchy     │            │ - Build prompt  │
    │ - Base64 encode │           │ - Colors        │            │ - Call API      │
    │ - Resize if big │           │ - Typography    │            │ - Parse response│
    └────────┬────────┘           │ - Spacing       │            └────────┬────────┘
             │                    │ - Components    │                     │
             │                    └────────┬────────┘                     │
             │                             │                              │
             └─────────────────────────────┼──────────────────────────────┘
                                           │
                                           ▼
                             ┌─────────────────────────────────┐
                             │        LOADING STATE            │
                             │                                 │
                             │  ○ Capturing screenshot... ✓    │
                             │  ○ Extracting design data... ✓  │
                             │  ● Analyzing with Claude...     │
                             │    [████████░░░░░░░░]           │
                             └───────────────┬─────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │ Success                │                        │ Error
                    ▼                        │                        ▼
    ┌─────────────────────────┐              │       ┌─────────────────────────┐
    │   RESULTS VIEW          │              │       │   ERROR STATE           │
    │                         │              │       │                         │
    │   Score: 78/100         │              │       │   ⚠️ Analysis failed    │
    │                         │              │       │                         │
    │   🔴 2 Critical         │              │       │   "Rate limit exceeded" │
    │   🟡 3 Warnings         │              │       │                         │
    │   💡 5 Suggestions      │              │       │   [Retry] [Settings]    │
    │                         │              │       │                         │
    │   [Issue cards...]      │              │       └─────────────────────────┘
    │                         │              │
    │   [Re-analyze] [Copy]   │              │
    └───────────────┬─────────┘              │
                    │                        │
                    ▼                        │
    ┌─────────────────────────┐              │
    │ User clicks issue       │              │
    │ [Go to layer]           │              │
    └───────────────┬─────────┘              │
                    │                        │
                    ▼                        │
    ┌─────────────────────────┐              │
    │ Figma selects layer     │              │
    │ Viewport zooms to it    │──────────────┘
    └─────────────────────────┘     User fixes, re-analyzes
```

---

### Flow 3: Data Flow (Technical)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘

  FIGMA CANVAS                PLUGIN SANDBOX               PLUGIN UI (iframe)
  ────────────                ──────────────               ──────────────────
       │                            │                              │
       │  figma.currentPage         │                              │
       │  .selection                │                              │
       │ ◀──────────────────────────│                              │
       │                            │                              │
       │  SceneNode[]               │     postMessage              │
       │ ──────────────────────────▶│ ────────────────────────────▶│
       │                            │   {type: 'selection',        │
       │                            │    frame: {...}}             │
       │                            │                              │
       │                            │                              │
       │                            │     postMessage              │
       │                            │ ◀────────────────────────────│
       │                            │   {type: 'analyze'}          │
       │                            │                              │
       │  frame.exportAsync()       │                              │
       │ ◀──────────────────────────│                              │
       │                            │                              │
       │  Uint8Array (PNG)          │                              │
       │ ──────────────────────────▶│                              │
       │                            │                              │
       │  traverse(frame)           │                              │
       │ ◀──────────────────────────│                              │
       │                            │                              │
       │  FrameAnalysis             │     postMessage              │
       │ ──────────────────────────▶│ ────────────────────────────▶│
       │                            │   {type: 'analyzing',        │
       │                            │    screenshot: base64,       │
       │                            │    frameData: {...}}         │
       │                            │                              │
       │                            │              ┌───────────────┴───────────────┐
       │                            │              │          LLM API              │
       │                            │              │                               │
       │                            │              │  fetch('api.anthropic.com')   │
       │                            │              │  ──────────────────────────▶  │
       │                            │              │                               │
       │                            │              │  {critique: {...}}            │
       │                            │              │  ◀──────────────────────────  │
       │                            │              │                               │
       │                            │              └───────────────┬───────────────┘
       │                            │                              │
       │                            │     postMessage              │
       │                            │ ◀────────────────────────────│
       │                            │   {type: 'goToLayer',        │
       │                            │    nodeId: '123:456'}        │
       │                            │                              │
       │  figma.getNodeById()       │                              │
       │  figma.viewport.scroll..() │                              │
       │ ◀──────────────────────────│                              │
       │                            │                              │
```

---

## Technical Implementation

### Step 1: Plugin Setup

```typescript
// manifest.json
{
  "name": "Figmatic",
  "id": "com.figmatic.ux-critique",
  "api": "1.0.0",
  "main": "dist/plugin.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": [
      "api.anthropic.com",
      "api.openai.com",
      "generativelanguage.googleapis.com",
      "localhost"  // for Ollama
    ]
  }
}
```

---

### Step 2: Plugin Controller (Sandbox)

```typescript
// src/plugin/controller.ts

// Show UI
figma.showUI(__html__, { width: 400, height: 600 });

// Listen for selection changes
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;

  if (selection.length === 1 && selection[0].type === 'FRAME') {
    const frame = selection[0] as FrameNode;
    figma.ui.postMessage({
      type: 'frame-selected',
      frame: {
        id: frame.id,
        name: frame.name,
        width: frame.width,
        height: frame.height,
      }
    });
  } else {
    figma.ui.postMessage({ type: 'no-frame-selected' });
  }
});

// Listen for UI messages
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'analyze':
      await handleAnalyze(msg.frameId);
      break;
    case 'go-to-layer':
      handleGoToLayer(msg.nodeId);
      break;
    case 'save-config':
      await figma.clientStorage.setAsync('config', msg.config);
      break;
    case 'get-config':
      const config = await figma.clientStorage.getAsync('config');
      figma.ui.postMessage({ type: 'config', config });
      break;
  }
};

async function handleAnalyze(frameId: string) {
  const frame = figma.getNodeById(frameId) as FrameNode;
  if (!frame) return;

  // 1. Capture screenshot
  figma.ui.postMessage({ type: 'status', status: 'capturing' });
  const screenshot = await captureScreenshot(frame);

  // 2. Extract frame data
  figma.ui.postMessage({ type: 'status', status: 'extracting' });
  const frameData = extractFrameData(frame);

  // 3. Send to UI for LLM analysis
  figma.ui.postMessage({
    type: 'ready-for-analysis',
    screenshot,  // base64 PNG
    frameData,   // structured data
  });
}

function handleGoToLayer(nodeId: string) {
  const node = figma.getNodeById(nodeId);
  if (node) {
    figma.currentPage.selection = [node as SceneNode];
    figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
  }
}
```

---

### Step 3: Screenshot Capture

```typescript
// src/plugin/extractors/screenshot.ts

export async function captureScreenshot(frame: FrameNode): Promise<string> {
  // Export at 2x for quality, but cap size for API limits
  const maxDimension = 2048;
  const scale = Math.min(2, maxDimension / Math.max(frame.width, frame.height));

  const bytes = await frame.exportAsync({
    format: 'PNG',
    constraint: { type: 'SCALE', value: scale }
  });

  // Convert to base64
  return figma.base64Encode(bytes);
}
```

---

### Step 4: Frame Data Extraction

```typescript
// src/plugin/extractors/index.ts

export function extractFrameData(frame: FrameNode): FrameAnalysis {
  return {
    name: frame.name,
    dimensions: { width: frame.width, height: frame.height },
    hierarchy: extractHierarchy(frame),
    layout: extractLayout(frame),
    typography: extractTypography(frame),
    colors: extractColors(frame),
    accessibility: extractAccessibility(frame),
  };
}

// src/plugin/extractors/hierarchy.ts
function extractHierarchy(node: SceneNode, depth = 0, path = ''): HierarchyNode {
  const currentPath = path ? `${path} > ${node.name}` : node.name;

  const result: HierarchyNode = {
    id: node.id,
    name: node.name,
    type: node.type,
    path: currentPath,
    depth,
    visible: node.visible,
  };

  if ('children' in node) {
    result.children = node.children.map(child =>
      extractHierarchy(child, depth + 1, currentPath)
    );
  }

  return result;
}

// src/plugin/extractors/colors.ts
function extractColors(frame: FrameNode): ColorAnalysis {
  const colors: Map<string, ColorUsage> = new Map();

  traverse(frame, (node) => {
    if ('fills' in node && Array.isArray(node.fills)) {
      node.fills.forEach((fill: Paint) => {
        if (fill.type === 'SOLID' && fill.visible !== false) {
          const hex = rgbToHex(fill.color);
          const existing = colors.get(hex) || { hex, count: 0, usages: [] };
          existing.count++;
          existing.usages.push({ nodeId: node.id, nodeName: node.name, type: 'fill' });
          colors.set(hex, existing);
        }
      });
    }
  });

  return {
    palette: Array.from(colors.values()).sort((a, b) => b.count - a.count),
    contrastPairs: findContrastPairs(frame),
  };
}

// src/plugin/extractors/accessibility.ts
function extractAccessibility(frame: FrameNode): AccessibilityAnalysis {
  const issues: AccessibilityIssue[] = [];

  traverse(frame, (node) => {
    // Check contrast
    if (node.type === 'TEXT') {
      const contrast = calculateContrast(node);
      if (contrast && contrast.ratio < 4.5) {
        issues.push({
          type: 'contrast',
          severity: contrast.ratio < 3 ? 'critical' : 'warning',
          nodeId: node.id,
          nodeName: node.name,
          nodePath: getNodePath(node),
          details: {
            ratio: contrast.ratio,
            required: 4.5,
            foreground: contrast.foreground,
            background: contrast.background,
          }
        });
      }
    }

    // Check touch targets
    if (isInteractive(node) && (node.width < 44 || node.height < 44)) {
      issues.push({
        type: 'touch-target',
        severity: 'warning',
        nodeId: node.id,
        nodeName: node.name,
        nodePath: getNodePath(node),
        details: {
          width: node.width,
          height: node.height,
          required: 44,
        }
      });
    }
  });

  return { issues };
}
```

---

### Step 5: LLM Provider Abstraction

```typescript
// src/llm/providers/base.ts

export interface LLMProvider {
  id: string;
  name: string;
  models: ModelInfo[];

  validateKey(key: string): Promise<boolean>;
  analyze(input: AnalysisInput): Promise<CritiqueResult>;
}

export interface AnalysisInput {
  screenshot: string;  // base64
  frameData: FrameAnalysis;
  context?: string;
  focus?: CritiqueFocus;
}

// src/llm/providers/anthropic.ts
export class AnthropicProvider implements LLMProvider {
  id = 'anthropic';
  name = 'Anthropic (Claude)';
  models = [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', tier: 'recommended' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', tier: 'recommended' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', tier: 'fast' },
  ];

  async validateKey(key: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async analyze(input: AnalysisInput): Promise<CritiqueResult> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: input.screenshot,
              },
            },
            {
              type: 'text',
              text: buildPrompt(input),
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    return parseCritiqueResponse(data.content[0].text);
  }
}

// src/llm/providers/openai.ts
export class OpenAIProvider implements LLMProvider {
  // Similar structure, different API format
}
```

---

### Step 6: Prompt Engineering

```typescript
// src/llm/prompts/critique.ts

export function buildPrompt(input: AnalysisInput): string {
  const { frameData, context, focus } = input;

  return `You are a senior UX designer conducting a design review.

## Design Context
Frame: "${frameData.name}"
Dimensions: ${frameData.dimensions.width} x ${frameData.dimensions.height}px
${context ? `Additional context: ${context}` : ''}

## Design Data
\`\`\`json
${JSON.stringify(frameData, null, 2)}
\`\`\`

## Your Task
Analyze this design screenshot along with the structured data provided.
${focus ? `Focus specifically on: ${focus}` : 'Provide a comprehensive UX review.'}

## Response Format
Respond with valid JSON matching this structure:
{
  "summary": "One sentence overall assessment",
  "score": <0-100>,
  "issues": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "category": "hierarchy" | "spacing" | "typography" | "color" | "accessibility" | "consistency",
      "element": "Layer name or path from the data",
      "elementId": "node ID if available",
      "title": "Brief issue title",
      "description": "What's wrong and why it matters",
      "recommendation": "Specific actionable fix"
    }
  ],
  "strengths": ["What's working well"],
  "priorities": ["Top 3 things to fix first"]
}

Be specific. Reference actual layer names from the data.
Prioritize issues that impact usability and accessibility.
Give actionable recommendations, not vague suggestions.`;
}
```

---

### Step 7: UI Components (React)

```typescript
// src/ui/App.tsx

function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameInfo | null>(null);
  const [critique, setCritique] = useState<CritiqueResult | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    // Listen for messages from plugin
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
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
          handleAnalysis(msg.screenshot, msg.frameData);
          break;
      }
    };

    // Request initial config
    parent.postMessage({ pluginMessage: { type: 'get-config' } }, '*');
  }, []);

  if (!config?.apiKey) {
    return <SetupScreen onSave={handleSaveConfig} />;
  }

  if (!selectedFrame) {
    return <EmptyState />;
  }

  return (
    <div className="app">
      <FramePreview frame={selectedFrame} />

      {status === 'idle' && !critique && (
        <AnalyzeButton onClick={handleAnalyze} />
      )}

      {status !== 'idle' && (
        <LoadingState status={status} />
      )}

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

// src/ui/components/CritiqueResults.tsx
function CritiqueResults({ critique, onGoToLayer, onReanalyze }) {
  return (
    <div className="critique-results">
      <header className="critique-header">
        <h2>{critique.summary}</h2>
        <ScoreGauge score={critique.score} />
      </header>

      <SeveritySummary issues={critique.issues} />

      <div className="issues-list">
        {critique.issues.map((issue) => (
          <IssueCard
            key={issue.elementId || issue.title}
            issue={issue}
            onGoToLayer={() => onGoToLayer(issue.elementId)}
          />
        ))}
      </div>

      <section className="strengths">
        <h3>✅ What's Working</h3>
        <ul>
          {critique.strengths.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </section>

      <footer className="critique-actions">
        <button onClick={onReanalyze}>Re-analyze</button>
        <button onClick={() => copyToClipboard(critique)}>Copy</button>
      </footer>
    </div>
  );
}
```

---

## Error States & Edge Cases

| Scenario | Detection | User Message | Recovery |
|----------|-----------|--------------|----------|
| No frame selected | `selection.length === 0` | "Select a frame to analyze" | Auto-update on selection |
| Multiple frames selected | `selection.length > 1` | "Select a single frame" | Show count, ask to pick one |
| Non-frame selected | `selection[0].type !== 'FRAME'` | "Please select a frame (not component/group)" | Explain difference |
| Invalid API key | 401 response | "Invalid API key. Check your settings." | Link to settings |
| Rate limited | 429 response | "Rate limit reached. Try again in X seconds." | Show countdown, auto-retry |
| Network error | fetch throws | "Network error. Check your connection." | Retry button |
| Large frame timeout | Response > 30s | "This frame is complex. Still analyzing..." | Extended timeout, progress |
| LLM returns invalid JSON | JSON.parse fails | "Couldn't parse response. Retrying..." | Auto-retry with stricter prompt |
| Layer deleted before navigate | `getNodeById` returns null | "This layer no longer exists" | Disable "go to" button |

---

## Success Metrics (For Future)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Setup completion | > 80% | Users who enter valid key after install |
| Critiques per user | > 3/week | Count analyze clicks |
| Go-to-layer usage | > 50% | Clicks on layer links |
| Return usage | > 40% | Users who come back next week |
| Copy/Export usage | > 20% | Clicks on copy button |

---

*This document serves as the source of truth for implementation. Update as decisions are made.*
