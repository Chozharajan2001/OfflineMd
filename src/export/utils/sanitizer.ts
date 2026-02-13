// Placeholder sanitizer – can be expanded with DOMPurify or similar.
export async function sanitizeHTML(html: string): Promise<string> {
  // For now we just return the input; the live preview already sanitises output.
  return html;
}
