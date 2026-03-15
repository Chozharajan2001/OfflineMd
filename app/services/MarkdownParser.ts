import { unified } from 'unified';
import remarkParse from 'remark-parse';
// Use safe dynamic requires to avoid TS typings issues with plugin packages
declare var require: any;
/* eslint-disable @typescript-eslint/no-var-requires */
const remarkGfm: any = require('remark-gfm');
const remarkEmoji: any = require('remark-emoji');
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
// mermaid rendering handled on client preview

export class MarkdownParser {
  private processor = unified()
    .use(remarkParse)
    .use(remarkGfm as any)
    .use(remarkEmoji as any)
    .use(remarkRehype)
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
    .use(rehypeStringify);

  async parse(markdown: string): Promise<string> {
    const file = await this.processor.process(markdown);
    return String(file);
  }
}

export const markdownParser = new MarkdownParser();
