import type { FrameAnalysis, HierarchyNode, ColorUsage, TypographyUsage } from '../../shared/types';

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Traverse all nodes in a tree
function traverse(node: SceneNode, callback: (node: SceneNode) => void) {
  callback(node);
  if ('children' in node) {
    for (const child of node.children) {
      traverse(child, callback);
    }
  }
}

// Extract hierarchy tree
function extractHierarchy(node: SceneNode, depth = 0, parentPath = ''): HierarchyNode {
  const path = parentPath ? `${parentPath} > ${node.name}` : node.name;

  const result: HierarchyNode = {
    id: node.id,
    name: node.name,
    type: node.type,
    path,
    depth,
    visible: node.visible,
    width: 'width' in node ? Math.round(node.width) : undefined,
    height: 'height' in node ? Math.round(node.height) : undefined,
  };

  if ('children' in node && node.children.length > 0) {
    // Limit depth to avoid huge payloads
    if (depth < 6) {
      result.children = node.children.map(child =>
        extractHierarchy(child, depth + 1, path)
      );
    }
  }

  return result;
}

// Extract colors used in the frame
function extractColors(frame: FrameNode): ColorUsage[] {
  const colorMap = new Map<string, ColorUsage>();

  traverse(frame, (node) => {
    if ('fills' in node && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID' && fill.visible !== false) {
          const hex = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
          const existing = colorMap.get(hex) || { hex, count: 0, usages: [] };
          existing.count++;
          if (existing.usages.length < 5) {
            existing.usages.push({
              nodeId: node.id,
              nodeName: node.name,
              type: 'fill',
            });
          }
          colorMap.set(hex, existing);
        }
      }
    }

    if ('strokes' in node && Array.isArray(node.strokes)) {
      for (const stroke of node.strokes) {
        if (stroke.type === 'SOLID' && stroke.visible !== false) {
          const hex = rgbToHex(stroke.color.r, stroke.color.g, stroke.color.b);
          const existing = colorMap.get(hex) || { hex, count: 0, usages: [] };
          existing.count++;
          if (existing.usages.length < 5) {
            existing.usages.push({
              nodeId: node.id,
              nodeName: node.name,
              type: 'stroke',
            });
          }
          colorMap.set(hex, existing);
        }
      }
    }
  });

  return Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 colors
}

// Extract typography info
function extractTypography(frame: FrameNode): TypographyUsage[] {
  const typographyMap = new Map<string, TypographyUsage>();

  traverse(frame, (node) => {
    if (node.type === 'TEXT') {
      const textNode = node as TextNode;
      const fontSize = typeof textNode.fontSize === 'number' ? textNode.fontSize : 16;
      const fontFamily = typeof textNode.fontName === 'object' ? textNode.fontName.family : 'Unknown';
      const fontWeight = typeof textNode.fontName === 'object' ? textNode.fontName.style : 'Regular';
      const lineHeight = typeof textNode.lineHeight === 'object' && textNode.lineHeight.unit !== 'AUTO'
        ? textNode.lineHeight.value
        : 'auto';

      const key = `${fontFamily}-${fontSize}-${fontWeight}`;
      const existing = typographyMap.get(key) || {
        fontFamily,
        fontSize,
        fontWeight: fontWeight === 'Bold' ? 700 : fontWeight === 'Medium' ? 500 : 400,
        lineHeight,
        count: 0,
        nodeIds: [],
      };

      existing.count++;
      if (existing.nodeIds.length < 5) {
        existing.nodeIds.push(node.id);
      }
      typographyMap.set(key, existing);
    }
  });

  return Array.from(typographyMap.values())
    .sort((a, b) => b.count - a.count);
}

// Check if frame uses auto-layout
function hasAutoLayout(frame: FrameNode): boolean {
  let found = false;
  traverse(frame, (node) => {
    if ('layoutMode' in node && node.layoutMode !== 'NONE') {
      found = true;
    }
  });
  return found;
}

// Count components
function countComponents(frame: FrameNode): number {
  let count = 0;
  traverse(frame, (node) => {
    if (node.type === 'INSTANCE') {
      count++;
    }
  });
  return count;
}

// Count total layers
function countLayers(frame: FrameNode): number {
  let count = 0;
  traverse(frame, () => {
    count++;
  });
  return count;
}

// Main extraction function
export function extractFrameData(frame: FrameNode): FrameAnalysis {
  return {
    name: frame.name,
    dimensions: {
      width: Math.round(frame.width),
      height: Math.round(frame.height),
    },
    hierarchy: extractHierarchy(frame),
    layerCount: countLayers(frame),
    colors: extractColors(frame),
    typography: extractTypography(frame),
    hasAutoLayout: hasAutoLayout(frame),
    componentCount: countComponents(frame),
  };
}
