import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
// remark-mermaid removed because it depends onfs/puppeteer (server-side)

export class MarkdownParser {
  private processor = unified()
    .use(remarkParse)
    // .use(remarkMermaid) -- Removed
    .use(remarkRehype)
    .use(rehypeSanitize, {
      attributes: {
        '*': ['className', 'class'],
        'code': ['className', 'class'],
        'span': ['className', 'class'],
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