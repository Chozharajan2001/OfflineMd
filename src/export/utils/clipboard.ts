/**
 * Copy text reliably: Clipboard API first, legacy execCommand fallback.
 * navigator.clipboard is undefined on insecure origins and can reject
 * (NotAllowedError) without focus — both previously surfaced as silent
 * or "Copy failed" with no recovery path.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to legacy path
    }
  }

  await new Promise<void>((resolve, reject) => {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
      document.body.appendChild(area);
      area.select();
      area.setSelectionRange(0, area.value.length);
      const ok = document.execCommand('copy');
      area.remove();
      if (ok) resolve();
      else reject(new Error('execCommand returned false'));
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Copy failed'));
    }
  });
}
