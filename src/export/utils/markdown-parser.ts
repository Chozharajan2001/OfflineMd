import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Node } from 'unist';

/**
 * Parses raw markdown into a Unified AST.
 * Returns the root node. Consumers can walk the AST as needed.
 */
export async function parseMarkdownToAST(markdown: string): Promise<Node> {
    const processor = unified().use(remarkParse);
    const file = await processor.process(markdown);
    // `file` implements the VFile interface; its `value` holds the original string.
    return file as unknown as Node;
}
