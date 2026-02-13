import { saveAs } from 'file-saver';

/** Simple wrapper that centralises the download call */
export async function triggerDownload(blob: Blob, filename: string) {
  saveAs(blob, filename);
}
