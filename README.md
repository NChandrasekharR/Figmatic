# Figmatic - AI-Powered UX Critique for Figma

Get instant AI feedback on your Figma designs. Powered by Claude, BYOK (Bring Your Own Key).

## Features

- **Frame Analysis** - Select any frame and get comprehensive UX feedback
- **Screenshot + Data** - Combines visual analysis with structured design data
- **Actionable Issues** - Get specific, fixable recommendations with severity levels
- **Go to Layer** - Click to navigate directly to problematic layers
- **BYOK** - Your API key stays on your machine, never sent to us

## Quick Start

### 1. Build the Plugin

```bash
npm install
npm run build
```

### 2. Load in Figma

1. Open Figma Desktop
2. Go to **Plugins** → **Development** → **Import plugin from manifest...**
3. Select the `dist/manifest.json` file

### 3. Configure API Key

1. Open the plugin (Plugins → Development → Figmatic)
2. Enter your Anthropic API key
3. Select your preferred model (Sonnet 4 recommended)
4. Click **Save & Continue**

### 4. Analyze Designs

1. Select a frame in your Figma document
2. Click **Analyze Design**
3. Review the critique and click issues to navigate to layers

## Getting an API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account or sign in
3. Go to **API Keys** and create a new key
4. Copy the key (starts with `sk-ant-...`)

## Cost Estimates

| Model | Quality | Cost per Critique |
|-------|---------|-------------------|
| Claude Sonnet 4 | Best | ~$0.02-0.03 |
| Claude 3.5 Sonnet | Great | ~$0.02-0.03 |
| Claude 3 Haiku | Fast | ~$0.002 |

100 critiques with Sonnet ≈ $2-3

## Development

```bash
# Install dependencies
npm install

# Build once
npm run build

# Watch mode (rebuild on changes)
npm run dev

# Type check
npm run typecheck
```

## Project Structure

```
figmatic/
├── src/
│   ├── plugin/           # Figma sandbox code
│   │   ├── controller.ts # Main plugin logic
│   │   └── extractors/   # Frame data extraction
│   ├── ui/               # React UI
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── stores/
│   ├── llm/              # LLM integration
│   │   └── anthropic.ts
│   └── shared/           # Shared types
├── dist/                 # Built plugin (load this in Figma)
├── public/
│   └── manifest.json
└── package.json
```

## How It Works

1. **Selection** - Plugin detects when you select a frame
2. **Capture** - Exports frame as PNG screenshot
3. **Extract** - Analyzes layer hierarchy, colors, typography
4. **Analyze** - Sends screenshot + data to Claude with UX critique prompt
5. **Display** - Shows structured issues with severity and recommendations

## Supported Critique Categories

- **Hierarchy** - Visual hierarchy and information architecture
- **Spacing** - Consistency and alignment
- **Typography** - Font choices and readability
- **Color** - Palette usage and contrast
- **Accessibility** - WCAG compliance issues
- **Consistency** - Component and style consistency

## License

MIT
