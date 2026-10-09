import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Node } from 'unist';

/**
 * Parses raw markdown into a Unified AST.
 * Returns the root node. Consumers can walk the AST as needed.
 */
export function parseMarkdownToAST(markdown: string): Node {
    const processor = unified().use(remarkParse);
    return processor.parse(markdown) as Node;
}
