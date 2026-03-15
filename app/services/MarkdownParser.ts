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
      tagNames: ['div','p','a','img','table','thead','tbody','tr','th','td','pre','code','ul','ol','li','hr','blockquote','h1','h2','h3','h4','h5','h6','span'],
      attributes: {
        '*': ['className', 'class'],
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title'],
        'th': ['colspan','rowspan'],
        'td': ['colspan','rowspan']
      }
    })
    .use(rehypeHighlight)
    .use(rehypeStringify);

  async parse(markdown: string): Promise<string> {
    const file = await this.processor.process(markdown);
    return String(file);
  }
}

export const markdownParser = new MarkdownParser();
