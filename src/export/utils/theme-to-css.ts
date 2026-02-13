import type { ThemeTokens } from '../types';

export function themeToCSS(theme: ThemeTokens): string {
    const { ui, editor, preview } = theme;
    return `
/* CSS Variables */
:root {
  /* UI level */
  --background: ${ui.background};
  --foreground: ${ui.foreground};
  --border: ${ui.border};
  --accent: ${ui.accent};

  /* Editor level */
  --editor-bg: ${editor.background};
  --editor-fg: ${editor.foreground};

  /* Preview level */
  --preview-bg: ${preview.background};
  --preview-fg: ${preview.foreground};
}

/* Base Styles */
.preview-content {
  font-family: ${preview.fontFamily};
  font-size: ${preview.fontSize}px;
  line-height: 1.75;
  color: ${preview.foreground};
  background-color: ${preview.background};
  padding: 2rem;
  max-width: 100%;
  overflow-wrap: break-word;
}

/* Headings */
.preview-content h1 {
  font-size: 2.25em;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 0.8em;
  line-height: 1.2;
  color: ${ui.accent};
  border-bottom: 1px solid ${ui.border};
  padding-bottom: 0.3em;
}

.preview-content h2 {
  font-size: 1.75em;
  font-weight: 600;
  margin-top: 1.6em;
  margin-bottom: 0.6em;
  line-height: 1.3;
  color: ${preview.foreground};
  border-bottom: 1px solid ${ui.border};
  padding-bottom: 0.2em;
}

.preview-content h3 {
  font-size: 1.5em;
  font-weight: 600;
  margin-top: 1.4em;
  margin-bottom: 0.6em;
  line-height: 1.4;
  color: ${preview.foreground};
}

.preview-content h4 {
  font-size: 1.25em;
  font-weight: 600;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  line-height: 1.5;
  color: ${preview.foreground};
}

.preview-content h5 {
  font-size: 1.1em;
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.4em;
  line-height: 1.5;
  color: ${preview.foreground};
}

.preview-content h6 {
  font-size: 1em;
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.4em;
  line-height: 1.5;
  color: ${preview.foreground};
  opacity: 0.8;
}

/* Paragraphs */
.preview-content p {
  margin-top: 0;
  margin-bottom: 1.25em;
  line-height: 1.75;
}

/* Links */
.preview-content a {
  color: ${ui.accent};
  text-decoration: underline;
  text-underline-offset: 2px;
}
.preview-content a:hover {
  text-decoration: none;
}

/* Strong and Emphasis */
.preview-content strong {
  font-weight: 600;
  color: ${ui.accent};
}

.preview-content em {
  font-style: italic;
}

.preview-content del {
  text-decoration: line-through;
  opacity: 0.7;
}

/* Lists */
.preview-content ul,
.preview-content ol {
  margin-top: 0;
  margin-bottom: 1.25em;
  padding-left: 2em;
}

.preview-content li {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  line-height: 1.75;
}

.preview-content ul li::marker {
  color: ${ui.accent};
}

.preview-content ol li::marker {
  color: ${ui.accent};
  font-weight: 500;
}

.preview-content ul ul,
.preview-content ol ol,
.preview-content ul ol,
.preview-content ol ul {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

/* Blockquotes */
.preview-content blockquote {
  border-left: 4px solid ${ui.accent};
  padding-left: 1em;
  margin-top: 1.5em;
  margin-bottom: 1.5em;
  font-style: italic;
  background: ${ui.background}10;
  padding: 1em;
  border-radius: 0 4px 4px 0;
}

.preview-content blockquote p {
  margin-bottom: 0;
}

/* Horizontal Rule */
.preview-content hr {
  border: none;
  border-top: 2px solid ${ui.border};
  margin-top: 2em;
  margin-bottom: 2em;
}

/* Code - Inline */
.preview-content code {
  font-family: ${editor.fontFamily};
  font-size: 0.9em;
  background: ${ui.background}40;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  color: ${ui.accent};
}

/* Code - Blocks */
.preview-content pre {
  font-family: ${editor.fontFamily};
  background: ${editor.background};
  color: ${editor.foreground};
  padding: 1.25em;
  margin-top: 1.5em;
  margin-bottom: 1.5em;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid ${ui.border};
  line-height: 1.5;
}

.preview-content pre code {
  background: transparent;
  padding: 0;
  border-radius: 0;
  color: inherit;
  font-size: inherit;
}

/* Tables */
.preview-content table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.5em;
  margin-bottom: 1.5em;
  overflow-x: auto;
  display: block;
}

.preview-content th,
.preview-content td {
  padding: 0.75em 1em;
  text-align: left;
  border: 1px solid ${ui.border};
}

.preview-content th {
  font-weight: 600;
  background: ${ui.background}40;
  position: sticky;
  top: 0;
}

.preview-content tr:nth-child(even) {
  background: ${ui.background}20;
}

.preview-content tr:hover {
  background: ${ui.background}40;
}

/* Images */
.preview-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1.5em 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Details/Summary */
.preview-content details {
  margin-top: 1em;
  margin-bottom: 1em;
  padding: 0.5em;
  border: 1px solid ${ui.border};
  border-radius: 4px;
  background: ${ui.background}20;
}

.preview-content summary {
  cursor: pointer;
  font-weight: 600;
  padding: 0.5em;
}

.preview-content details[open] summary {
  margin-bottom: 0.5em;
}

/* Mark/Highlight */
.preview-content mark {
  background: ${ui.accent}30;
  padding: 0.1em 0.2em;
  border-radius: 2px;
}

/* Superscript and Subscript */
.preview-content sup,
.preview-content sub {
  font-size: 0.75em;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

.preview-content sup {
  top: -0.5em;
}

.preview-content sub {
  bottom: -0.25em;
}

/* Highlight.js theme overrides */
.preview-content .hljs {
  background: ${editor.background};
  color: ${editor.foreground};
  padding: 0;
}

/* Mermaid diagram styling */
.preview-content .language-mermaid {
  text-align: center;
  padding: 1em;
  margin: 1.5em 0;
  background: ${ui.background}20;
  border-radius: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .preview-content {
    padding: 1rem;
    font-size: ${Math.max(12, preview.fontSize - 2)}px;
  }
  
  .preview-content h1 {
    font-size: 1.75em;
  }
  
  .preview-content h2 {
    font-size: 1.5em;
  }
  
  .preview-content h3 {
    font-size: 1.25em;
  }
}

/* Print styles */
@media print {
  .preview-content {
    padding: 0;
    background: white;
    color: black;
  }
  
  .preview-content h1,
  .preview-content h2,
  .preview-content h3,
  .preview-content h4,
  .preview-content h5,
  .preview-content h6 {
    color: black;
    border-color: #ccc;
  }
  
  .preview-content pre {
    background: #f5f5f5;
    border-color: #ddd;
  }
  
  .preview-content code {
    background: #f5f5f5;
    color: #333;
  }
}
`;
}
