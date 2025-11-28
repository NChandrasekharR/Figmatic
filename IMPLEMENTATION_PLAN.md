# Figmatic: UX Critique Plugin Implementation Plan

> A Figma plugin that leverages MCP (Model Context Protocol) to analyze frames and provide AI-powered UX feedback. BYOK (Bring Your Own Key), model agnostic.

---

## Table of Contents

1. [Concept Overview](#concept-overview)
2. [Architecture Options](#architecture-options)
3. [MCP Integration Strategy](#mcp-integration-strategy)
4. [BYOK & Model Agnostic Design](#byok--model-agnostic-design)
5. [Frame Data Extraction](#frame-data-extraction)
6. [UX Critique Output Format](#ux-critique-output-format)
7. [Tech Stack](#tech-stack)
8. [Project Structure](#project-structure)
9. [Implementation Phases](#implementation-phases)
10. [Open Questions](#open-questions)

---

## Concept Overview

**What it does:**
- User selects a frame in Figma
- Plugin extracts design data (hierarchy, spacing, colors, typography, components)
- Data is sent to user's chosen LLM with UX critique prompt
- Returns structured, actionable feedback

**Key principles:**
- **BYOK** - User provides their own API key (no backend costs, privacy)
- **Model Agnostic** - Works with OpenAI, Anthropic, Google, local models
- **MCP-Powered** - Uses Figma MCP for rich design understanding
- **Actionable Output** - Not just "this is bad" but "here's how to fix it"

---

## Architecture Options

### Option A: Plugin-Only (Recommended for MVP)

```
┌─────────────────────────────────────────────────┐
│                  Figma Plugin                   │
│  ┌───────────┐    ┌───────────┐    ┌─────────┐ │
│  │  Plugin   │───▶│   Data    │───▶│   LLM   │ │
│  │    UI     │    │ Extractor │    │ Adapter │ │
│  └───────────┘    └───────────┘    └────┬────┘ │
└─────────────────────────────────────────┼──────┘
                                          │
                    ┌─────────────────────▼──────┐
                    │   LLM APIs (User's Key)    │
                    │  OpenAI / Anthropic / etc  │
                    └────────────────────────────┘
```

**Pros:**
- Simple deployment (just install plugin)
- No server costs
- Works offline with local models (Ollama)
- User data never hits your servers

**Cons:**
- Limited by Figma plugin sandbox (no filesystem, limited network)
- MCP can't run inside plugin directly
- Have to reimplement Figma data extraction

---

### Option B: Plugin + Companion App

```
┌──────────────┐         ┌─────────────────────────────┐
│ Figma Plugin │◀───────▶│      Companion App          │
│   (thin UI)  │  WS/HTTP│  ┌─────────┐   ┌─────────┐  │
└──────────────┘         │  │ Figma   │   │   LLM   │  │
                         │  │  MCP    │   │ Router  │  │
                         │  └─────────┘   └─────────┘  │
                         └─────────────────────────────┘
```

**Pros:**
- Full MCP integration via official Figma MCP server
- Richer design understanding
- Can use Claude Desktop / other MCP hosts

**Cons:**
- User must install & run companion app
- More complex setup
- Cross-origin communication challenges

---

### Option C: Plugin + Cloud Backend

```
┌──────────────┐         ┌─────────────────────────────┐
│ Figma Plugin │────────▶│      Your Backend           │
└──────────────┘  HTTPS  │  ┌─────────┐   ┌─────────┐  │
                         │  │  MCP    │   │   LLM   │  │
                         │  │ Client  │   │ Proxy   │  │
                         │  └─────────┘   └─────────┘  │
                         └─────────────────────────────┘
```

**Pros:**
- Easiest user experience (just install plugin)
- Can cache/optimize LLM calls
- Analytics, usage tracking

**Cons:**
- Server costs
- User API keys transmitted to your server (trust issue)
- Latency
- Requires auth/user accounts

---

### Recommendation

**Start with Option A** for MVP:
- Fastest to build
- No infrastructure
- True BYOK (keys never leave user's machine)
- Can evolve to Option B later for power users

---

## MCP Integration Strategy

### The Challenge

MCP (Model Context Protocol) is designed to run as a local server that AI assistants connect to. The official Figma MCP server provides rich design data access. However:

- Figma plugins run in a sandboxed iframe
- Can't spawn local MCP servers from plugin
- Can't directly use MCP protocol from browser context

### Strategies

#### Strategy 1: Reimplement Data Extraction (MVP)

Build our own Figma data extractor using Figma Plugin API:

```typescript
// What we can extract via Plugin API
interface FrameAnalysis {
  hierarchy: NodeTree;
  styles: {
    colors: ColorStyle[];
    typography: TextStyle[];
    effects: EffectStyle[];
  };
  layout: {
    autoLayout: AutoLayoutConfig | null;
    constraints: Constraints;
    spacing: SpacingAnalysis;
  };
  components: ComponentUsage[];
  accessibility: {
    contrastIssues: ContrastIssue[];
    textSizes: TextSizeAnalysis;
  };
  screenshot?: string; // base64 PNG for visual analysis
}
```

**Pros:** Works standalone, no external dependencies
**Cons:** Have to build what MCP already provides

#### Strategy 2: MCP via Companion (Future)

For power users, offer optional companion app that:
- Runs Figma MCP server locally
- Plugin communicates via localhost WebSocket
- Full MCP capabilities

#### Strategy 3: Figma REST API + MCP Server (Future)

- User provides Figma access token
- Backend runs MCP server with REST API access
- Richer data than Plugin API alone

---

## BYOK & Model Agnostic Design

### Supported Providers

| Provider | Models | Notes |
|----------|--------|-------|
| OpenAI | gpt-4o, gpt-4-turbo, gpt-4o-mini | Vision capable |
| Anthropic | claude-sonnet-4-20250514, claude-3.5-sonnet, claude-3-haiku | Best for nuanced critique |
| Google | gemini-1.5-pro, gemini-1.5-flash | Good vision |
| Ollama | llava, llama3.2-vision | Local, private |
| OpenRouter | Any model | Aggregator option |

### Unified Interface

```typescript
interface LLMProvider {
  id: string;
  name: string;
  models: Model[];
  validateKey: (key: string) => Promise<boolean>;
  analyze: (input: AnalysisInput) => Promise<AnalysisOutput>;
}

interface AnalysisInput {
  frameData: FrameAnalysis;
  screenshot?: string; // base64
  context?: string; // user-provided context
  critiqueType: 'full' | 'accessibility' | 'hierarchy' | 'visual';
}

// Provider implementations
const providers: Record<string, LLMProvider> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  google: new GoogleProvider(),
  ollama: new OllamaProvider(),
  openrouter: new OpenRouterProvider(),
};
```

### Key Storage

```typescript
// Figma plugin clientStorage (persists per user, encrypted by Figma)
await figma.clientStorage.setAsync('llm_config', {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  apiKey: 'sk-ant-...', // stored locally only
});
```

### Prompt Engineering

Each provider gets the same structured prompt, adapted for their format:

```typescript
const systemPrompt = `You are a senior UX designer reviewing Figma designs.
Analyze the provided design data and screenshot.
Provide actionable, specific feedback.

Output format:
{
  "summary": "One-line overall assessment",
  "score": 0-100,
  "issues": [
    {
      "severity": "critical|warning|suggestion",
      "category": "hierarchy|spacing|typography|color|accessibility|consistency",
      "element": "layer name or path",
      "issue": "what's wrong",
      "recommendation": "how to fix",
      "wcag"?: "relevant guideline if accessibility"
    }
  ],
  "strengths": ["what's working well"],
  "priorities": ["top 3 things to fix first"]
}`;
```

---

## Frame Data Extraction

### What We Extract

```typescript
interface FrameAnalysis {
  // Basic info
  name: string;
  dimensions: { width: number; height: number };

  // Hierarchy
  tree: {
    node: SceneNode;
    children: TreeNode[];
    depth: number;
    path: string; // "Frame > Header > Logo"
  };

  // Layout
  layout: {
    type: 'auto-layout' | 'absolute' | 'mixed';
    direction?: 'horizontal' | 'vertical';
    spacing?: number;
    padding?: { top: number; right: number; bottom: number; left: number };
    alignment?: string;
    issues: LayoutIssue[]; // e.g., "inconsistent spacing"
  };

  // Typography
  typography: {
    fonts: FontUsage[];
    sizes: number[];
    lineHeights: number[];
    hierarchy: TextHierarchy; // is there clear H1 > H2 > body?
  };

  // Colors
  colors: {
    palette: Color[];
    backgrounds: Color[];
    foregrounds: Color[];
    contrastPairs: ContrastPair[]; // with WCAG ratios
  };

  // Components
  components: {
    instances: ComponentInstance[];
    detachedCount: number;
    consistencyScore: number;
  };

  // Accessibility
  accessibility: {
    contrastIssues: ContrastIssue[];
    touchTargets: TouchTargetIssue[]; // < 44px
    textSizeIssues: TextSizeIssue[]; // < 12px
    missingAltText: string[]; // images without descriptions
  };
}
```

### Screenshot Capture

```typescript
// Export frame as PNG for visual analysis
const screenshot = await frame.exportAsync({
  format: 'PNG',
  constraint: { type: 'SCALE', value: 2 }
});
const base64 = figma.base64Encode(screenshot);
```

---

## UX Critique Output Format

### Structured Response

```typescript
interface UXCritique {
  summary: string;
  overallScore: number; // 0-100

  categories: {
    hierarchy: CategoryScore;
    spacing: CategoryScore;
    typography: CategoryScore;
    color: CategoryScore;
    accessibility: CategoryScore;
    consistency: CategoryScore;
  };

  issues: Issue[];
  strengths: string[];
  priorities: string[]; // "Fix these first"

  // Optional deep dives
  accessibilityReport?: AccessibilityReport;
  designSystemCompliance?: ComplianceReport;
}

interface Issue {
  id: string;
  severity: 'critical' | 'warning' | 'suggestion';
  category: string;
  element: string; // layer name/path
  elementId?: string; // Figma node ID for navigation
  title: string;
  description: string;
  recommendation: string;
  learnMore?: string; // link to resource
}
```

### UI Display

```
┌─────────────────────────────────────────────────────┐
│  UX Critique for "Homepage Hero"          Score: 72 │
├─────────────────────────────────────────────────────┤
│  ⚠️  3 Critical  │  ⚡ 5 Warnings  │  💡 8 Suggestions │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔴 CRITICAL: Low contrast on CTA button            │
│     Layer: Hero > CTA Button > Label                │
│     Contrast ratio 2.1:1 fails WCAG AA (min 4.5:1)  │
│     → Change text to #FFFFFF or darken background   │
│     [Go to layer]                                   │
│                                                     │
│  🟡 WARNING: Inconsistent spacing                   │
│     Layer: Hero > Content                           │
│     Gap varies: 16px, 24px, 20px                    │
│     → Standardize to 24px (your base unit)          │
│     [Go to layer]                                   │
│                                                     │
│  💡 SUGGESTION: Consider text hierarchy             │
│     ...                                             │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ✅ Strengths                                        │
│  • Good use of auto-layout                          │
│  • Consistent component usage                       │
│  • Clear visual hierarchy in navigation             │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Plugin

| Layer | Technology | Rationale |
|-------|------------|-----------|
| UI Framework | **React** | Standard for Figma plugins, good ecosystem |
| Language | **TypeScript** | Type safety, better DX |
| Styling | **Tailwind CSS** or **CSS Modules** | Utility-first or scoped styles |
| Build | **Vite** | Fast builds, good plugin ecosystem |
| State | **Zustand** | Lightweight, no boilerplate |

### LLM Integration

| Concern | Approach |
|---------|----------|
| API Calls | Native fetch (works in Figma sandbox) |
| Streaming | SSE parsing for real-time feedback |
| Retry Logic | Exponential backoff, timeout handling |
| Rate Limiting | Queue system, user feedback |

### Testing

| Type | Tool |
|------|------|
| Unit | Vitest |
| Integration | Playwright (for plugin UI) |
| LLM Mocking | MSW (Mock Service Worker) |

---

## Project Structure

```
figmatic/
├── src/
│   ├── plugin/                 # Figma plugin code (runs in Figma)
│   │   ├── controller.ts       # Main plugin controller
│   │   ├── extractors/         # Frame data extraction
│   │   │   ├── hierarchy.ts
│   │   │   ├── layout.ts
│   │   │   ├── typography.ts
│   │   │   ├── colors.ts
│   │   │   ├── accessibility.ts
│   │   │   └── index.ts
│   │   └── utils/
│   │
│   ├── ui/                     # Plugin UI (React app in iframe)
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── CritiqueView/
│   │   │   ├── SettingsPanel/
│   │   │   ├── IssueCard/
│   │   │   └── ScoreGauge/
│   │   ├── hooks/
│   │   ├── stores/
│   │   │   ├── configStore.ts
│   │   │   └── critiqueStore.ts
│   │   └── styles/
│   │
│   ├── llm/                    # LLM integration layer
│   │   ├── providers/
│   │   │   ├── base.ts         # Abstract provider
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── google.ts
│   │   │   ├── ollama.ts
│   │   │   └── openrouter.ts
│   │   ├── prompts/
│   │   │   ├── system.ts
│   │   │   ├── critique.ts
│   │   │   └── accessibility.ts
│   │   └── types.ts
│   │
│   ├── shared/                 # Shared types & utilities
│   │   ├── types/
│   │   │   ├── frame.ts
│   │   │   ├── critique.ts
│   │   │   └── config.ts
│   │   └── utils/
│   │
│   └── constants/
│       ├── wcag.ts             # WCAG guidelines reference
│       └── providers.ts        # Provider configs
│
├── public/
│   └── manifest.json           # Figma plugin manifest
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/               # Sample Figma data
│
├── docs/
│   ├── ARCHITECTURE.md
│   └── ADDING_PROVIDERS.md
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Project setup (Vite + React + TypeScript)
- [ ] Figma plugin boilerplate
- [ ] Basic UI shell (settings, main view)
- [ ] Single LLM provider (Anthropic)
- [ ] Basic frame data extraction (hierarchy only)
- [ ] Simple critique display

**Deliverable:** Plugin that can analyze a frame with Claude and show raw response

### Phase 2: Core Features (Week 3-4)

- [ ] Full frame data extraction
  - [ ] Layout analysis
  - [ ] Typography extraction
  - [ ] Color palette extraction
  - [ ] Basic accessibility checks
- [ ] Structured critique output
- [ ] Issue cards with severity
- [ ] "Go to layer" navigation
- [ ] Screenshot capture for visual analysis

**Deliverable:** Useful UX critique with actionable feedback

### Phase 3: Multi-Provider (Week 5-6)

- [ ] Provider abstraction layer
- [ ] Add OpenAI provider
- [ ] Add Google provider
- [ ] Add Ollama provider (local)
- [ ] Provider settings UI
- [ ] API key validation
- [ ] Model selection per provider

**Deliverable:** True BYOK with model choice

### Phase 4: Polish & Advanced (Week 7-8)

- [ ] Streaming responses
- [ ] Critique history
- [ ] Export reports (PDF/Markdown)
- [ ] Custom critique focus (accessibility-only, etc.)
- [ ] Design system rules (custom checks)
- [ ] Onboarding flow
- [ ] Error handling & edge cases

**Deliverable:** Production-ready plugin

### Phase 5: Future Enhancements

- [ ] Companion app for MCP integration
- [ ] Figma REST API integration (analyze any file)
- [ ] Team sharing (share configs)
- [ ] Batch analysis (multiple frames)
- [ ] Before/after comparison
- [ ] Integration with design system tools

---

## Open Questions

### Technical

1. **Screenshot vs structured data** - How much should we rely on vision models vs extracted data?
   - Vision: Better for visual issues (alignment, visual hierarchy)
   - Data: Better for specific metrics (contrast ratios, exact spacing)
   - Recommendation: Both. Send data + screenshot.

2. **Streaming UX** - Show critique as it generates, or wait for full response?
   - Streaming feels faster
   - But structured JSON harder to stream
   - Option: Stream summary, then show full structured critique

3. **Rate limiting** - How to handle API limits gracefully?
   - Queue requests
   - Show progress
   - Offer retry

4. **Offline/Local** - How important is Ollama support?
   - Great for privacy-conscious users
   - Vision models via Ollama still limited
   - Worth including but not primary focus

### Product

1. **Free tier?** - Should there be any functionality without API key?
   - Could offer basic checks (contrast, spacing) without LLM
   - Good for discovery

2. **Critique presets** - Should we offer different critique "lenses"?
   - Accessibility focus
   - Mobile UX focus
   - Design system compliance
   - Developer handoff readiness

3. **Target persona** - Primary user?
   - Designer wanting feedback
   - Design lead reviewing work
   - Developer checking before implementation

---

## Appendix: Resources

### Figma Plugin Development
- [Figma Plugin API Docs](https://www.figma.com/plugin-docs/)
- [Figma Plugin Samples](https://github.com/figma/plugin-samples)

### MCP
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Figma MCP Server](https://github.com/anthropics/anthropic-quickstarts/tree/main/mcp-figma)

### UX Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Guidelines](https://material.io/design)
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)

### LLM APIs
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic API](https://docs.anthropic.com/)
- [Google AI Studio](https://ai.google.dev/)
- [Ollama](https://ollama.ai/)

---

*Last updated: 2024-11-28*
*Status: Planning*
