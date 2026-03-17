import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
// mermaid rendering handled on client preview, emoji support via GFM

class MarkdownParser {
  private processor: any;

  constructor() {
    this.processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeSanitize, {
        // Strict allowlist for markdown-generated content
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
          'figure', 'figcaption'
        ],
        attributes: {
          '*': ['className', 'class', 'id'],
          'a': ['href', 'title', 'target', 'rel'],
          'img': ['src', 'alt', 'title'],
          'th': ['colspan', 'rowspan'],
          'td': ['colspan', 'rowspan'],
          'ol': ['start', 'type'],
          'li': ['value']
        },
        // Strip dangerous protocols
        strip: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button']
      })
      .use(rehypeHighlight)
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
