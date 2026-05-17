import { httpError } from '../../lib/errors.js';

type TextNode =
  | { type: 'text'; text: string; marks?: Array<{ type: 'bold' | 'italic' | 'underline' }> }
  | { type: 'hardBreak' };

type ParagraphContent = TextNode[];

type SanitizedDoc = {
  type: 'doc';
  content: [{ type: 'paragraph'; content: ParagraphContent }];
};

/**
 * Recursively collects all text and hardBreak nodes from a TipTap doc,
 * preserving only bold/italic/underline marks, and flattens them into
 * a single paragraph. Drops empty text nodes, collapses whitespace runs,
 * and trims leading/trailing whitespace.
 *
 * Throws httpError(400) if the resulting doc has no non-empty text content.
 */
export function sanitizeMinuteDoc(doc: unknown): SanitizedDoc {
  const content = collectTextNodes(doc);

  if (content.length === 0 || isAllEmptyText(content)) {
    throw httpError(400, 'Conteúdo inválido');
  }

  // Trim leading/trailing whitespace from the entire paragraph
  const trimmed = trimContent(content);

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: trimmed
      }
    ]
  };
}

/**
 * Recursively walks the input doc and collects text + hardBreak nodes,
 * preserving allowed marks (bold, italic, underline).
 */
function collectTextNodes(node: unknown): ParagraphContent {
  const result: ParagraphContent = [];

  function walk(n: unknown) {
    if (n === null || n === undefined) return;

    if (typeof n === 'object') {
      const obj = n as Record<string, unknown>;

      // Handle text nodes
      if (obj.type === 'text' && typeof obj.text === 'string') {
        const marks = filterAllowedMarks(obj.marks);
        const collapsed = collapseWhitespace(obj.text);
        if (collapsed) {
          result.push({
            type: 'text',
            text: collapsed,
            ...(marks.length > 0 && { marks })
          });
        }
        return;
      }

      // Handle hardBreak nodes
      if (obj.type === 'hardBreak') {
        result.push({ type: 'hardBreak' });
        return;
      }

      // Recurse into nested content arrays
      if (Array.isArray(obj.content)) {
        for (const child of obj.content) {
          walk(child);
        }
        return;
      }

      // For other nodes (heading, list, etc), recurse into content
      if ('content' in obj && Array.isArray(obj.content)) {
        for (const child of obj.content) {
          walk(child);
        }
      }
    }
  }

  walk(node);
  return result;
}

/**
 * Filters marks to keep only bold, italic, underline.
 */
function filterAllowedMarks(marks: unknown): Array<{ type: 'bold' | 'italic' | 'underline' }> {
  if (!Array.isArray(marks)) return [];

  return marks
    .filter((m): m is { type: string } => m !== null && typeof m === 'object' && 'type' in m)
    .filter((m) => ['bold', 'italic', 'underline'].includes(m.type))
    .map((m) => ({ type: m.type as 'bold' | 'italic' | 'underline' }));
}

/**
 * Collapses runs of whitespace to single space and trims.
 */
function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Checks if content is all empty text nodes.
 */
function isAllEmptyText(content: ParagraphContent): boolean {
  return content.every((node) => node.type === 'text' && node.text.trim() === '');
}

/**
 * Trims leading/trailing whitespace from the content array.
 * Removes leading/trailing empty text nodes, and trims text edges.
 */
function trimContent(content: ParagraphContent): ParagraphContent {
  if (content.length === 0) return content;

  // Find first and last non-empty text node
  let start = 0;
  let end = content.length - 1;

  while (start <= end && isEmptyTextOrBreak(content[start])) {
    start++;
  }

  while (end >= start && isEmptyTextOrBreak(content[end])) {
    end--;
  }

  if (start > end) return [];

  const result = content.slice(start, end + 1);

  // Trim first text node
  if (result.length > 0 && result[0].type === 'text') {
    result[0] = {
      ...result[0],
      text: result[0].text.trimStart()
    };
  }

  // Trim last text node
  const lastNode = result[result.length - 1];
  if (lastNode && lastNode.type === 'text') {
    result[result.length - 1] = {
      ...lastNode,
      text: lastNode.text.trimEnd()
    };
  }

  return result;
}

/**
 * Returns true if the node is empty text or a hardBreak.
 */
function isEmptyTextOrBreak(node: TextNode): boolean {
  return node.type === 'hardBreak' || (node.type === 'text' && node.text.trim() === '');
}
