import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { visit } from 'unist-util-visit';
import type { Root as HastRoot } from 'hast';
import type { Root as MdastRoot } from 'mdast';
import type { Processor } from 'unified';
// mermaid rendering handled on client preview, emoji support via GFM

function rehypeForceSafeLinks() {
  return (tree: unknown) => {
    visit(tree as Parameters<typeof visit>[0], 'element', (node: unknown) => {
      const el = node as { tagName?: string; properties?: Record<string, unknown> };
      if (el.tagName === 'a' && el.properties) {
        if (el.properties.target === '_blank') {
          const rel = Array.isArray(el.properties.rel)
            ? el.properties.rel.map(String)
            : String(el.properties.rel || '').split(/\s+/).filter(Boolean);
          if (!rel.includes('noopener')) rel.push('noopener');
          if (!rel.includes('noreferrer')) rel.push('noreferrer');
          el.properties.rel = rel;
        }
      }
    });
  };
}

class MarkdownParser {
  private processor: Processor<MdastRoot, MdastRoot, HastRoot, HastRoot, string>;

  constructor() {
    this.processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex)
      .use(rehypeSanitize, {
        // Strict allowlist for markdown-generated content (+ KaTeX output)
        tagNames: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'strong', 'b', 'em', 'i', 'del', 's', 'mark',
          'a', 'img',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span', 'details', 'summary',
          'sup', 'sub',
          'figure', 'figcaption',
          // KaTeX (no style attr allowed; classes only)
          'math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn',
          'msup', 'msub', 'msubsup', 'mfrac', 'msqrt', 'mroot', 'mtext',
          'mspace', 'mover', 'munder', 'munderover', 'mtable', 'mtr', 'mtd',
        ],
        attributes: {
          '*': ['className', 'class', 'id', 'aria-hidden'],
          'a': ['href', 'title', 'target', 'rel'],
          'img': ['src', 'alt', 'title'],
          'th': ['colspan', 'rowspan'],
          'td': ['colspan', 'rowspan'],
          'ol': ['start', 'type'],
          'li': ['value'],
          'span': ['className', 'class', 'aria-hidden'],
          'math': ['display'],
          'annotation': ['encoding'],
        },
        // Strip dangerous protocols
        strip: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button']
      })
      .use(rehypeHighlight)
      .use(rehypeForceSafeLinks)
      .use(rehypeStringify, { allowDangerousHtml: true });
  }

  async parse(markdown: string): Promise<string> {
    try {
      if (!markdown) return '';
      
      // The core fix: await the process
      const vfile = await this.processor.process(markdown);
      
      // Return the string content
      return String(vfile);
    } catch (error) {
      console.error('[MarkdownParser] Error:', error);
      // Return original markdown so the user doesn't lose their work
      return markdown; 
    }
  }
}

export const markdownParser = new MarkdownParser();
