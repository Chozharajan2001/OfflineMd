import matter from 'gray-matter';

export interface FrontMatter {
  title?: string;
  author?: string;
  date?: string;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Split YAML front matter from the body. Never throws — on any parse
 * failure the whole document is treated as body with empty data.
 */
export function getFrontMatter(markdown: string): { data: FrontMatter; content: string } {
  try {
    if (!markdown.startsWith('---')) return { data: {}, content: markdown };
    const parsed = matter(markdown);
    const data = (parsed.data || {}) as FrontMatter;
    return { data, content: parsed.content };
  } catch {
    return { data: {}, content: markdown };
  }
}
