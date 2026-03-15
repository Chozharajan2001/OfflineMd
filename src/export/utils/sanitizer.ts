import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving markdown-generated content.
 * Uses DOMPurify for robust security with custom configuration for markdown use cases.
 * 
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export async function sanitizeHTML(html: string): Promise<string> {
  // Configure DOMPurify for markdown-rendered content
  const clean = DOMPurify.sanitize(html, {
    // Allowed HTML tags for markdown content
    ALLOWED_TAGS: [
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
    
    // Allowed attributes
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title',
      'class', 'className',
      'target', 'rel',
      'colspan', 'rowspan',
      'id', 'name'
    ],
    
    // URI validation - only allow safe protocols
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    
    // Forbid dangerous attributes
    FORBID_ATTR: [
      'style',           // Prevent inline style injection
      'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout', 'onmouseenter', 'onmouseleave',
      'onkeydown', 'onkeyup', 'onkeypress',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
      'onload', 'onerror', 'onabort', 'onscroll',
      'oncontextmenu', 'ondrag', 'ondrop', 'oninput', 'oninvalid', 'onsearch', 'onselect', 'onwheel'
    ],
    
    // Force safe link targets
    ADD_ATTR: ['target'],
    
    // Handle embedded content safely
    USE_PROFILES: {
      html: true,
      svg: false,        // Block SVG (can contain scripts)
      svgFilters: false, // Block SVG filters
      mathMl: false      // Block MathML
    }
  });
  
  return clean || '';
}
