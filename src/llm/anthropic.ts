import type { FrameAnalysis, CritiqueResult } from '../shared/types';

const SYSTEM_PROMPT = `You are a senior UX designer conducting a design review.
Your task is to analyze designs and provide actionable, specific feedback.

Focus on:
- Visual hierarchy and information architecture
- Spacing consistency and alignment
- Typography choices and readability
- Color usage and accessibility (especially contrast)
- Component consistency
- Mobile/responsive considerations
- Accessibility issues

Be constructive and specific. Reference actual layer names when possible.
Prioritize issues that impact usability and accessibility.`;

function buildUserPrompt(frameData: FrameAnalysis, context?: string): string {
  return `Analyze this Figma design frame.

## Frame Info
- Name: "${frameData.name}"
- Dimensions: ${frameData.dimensions.width} x ${frameData.dimensions.height}px
- Total layers: ${frameData.layerCount}
- Uses auto-layout: ${frameData.hasAutoLayout ? 'Yes' : 'No'}
- Component instances: ${frameData.componentCount}

## Layer Hierarchy (simplified)
\`\`\`json
${JSON.stringify(frameData.hierarchy, null, 2).slice(0, 3000)}
\`\`\`

## Colors Used (top colors by frequency)
${frameData.colors.slice(0, 10).map(c => `- ${c.hex}: used ${c.count} times`).join('\n')}

## Typography
${frameData.typography.slice(0, 8).map(t =>
  `- ${t.fontFamily} ${t.fontSize}px (${t.fontWeight}): used ${t.count} times`
).join('\n')}

${context ? `## Additional Context\n${context}` : ''}

## Required Response Format
Respond with valid JSON only (no markdown code blocks), matching this exact structure:
{
  "summary": "One sentence overall assessment",
  "score": 0-100,
  "issues": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "category": "hierarchy" | "spacing" | "typography" | "color" | "accessibility" | "consistency",
      "element": "Layer name or path from the hierarchy",
      "elementId": "node ID if you can identify it from the data",
      "title": "Brief issue title (5-10 words)",
      "description": "What's wrong and why it matters (1-2 sentences)",
      "recommendation": "Specific actionable fix (1-2 sentences)"
    }
  ],
  "strengths": ["What's working well (2-4 items)"],
  "priorities": ["Top 3 things to fix first"]
}

Analyze both the screenshot and the structured data. Be specific and actionable.`;
}

export async function analyzewithAnthropic(
  apiKey: string,
  model: string,
  screenshot: string,
  frameData: FrameAnalysis,
  context?: string
): Promise<CritiqueResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshot,
              },
            },
            {
              type: 'text',
              text: buildUserPrompt(frameData, context),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your settings.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error('No response from API');
  }

  // Parse the JSON response
  try {
    // Try to extract JSON from the response (in case it's wrapped in markdown)
    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const result = JSON.parse(jsonStr) as CritiqueResult;

    // Validate the response structure
    if (typeof result.score !== 'number' || !Array.isArray(result.issues)) {
      throw new Error('Invalid response structure');
    }

    return result;
  } catch (parseError) {
    console.error('Failed to parse response:', content);
    throw new Error('Failed to parse critique response. Please try again.');
  }
}

export async function validateAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
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
