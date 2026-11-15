import { createWorker, type Worker } from 'tesseract.js';
export interface ReadDocumentResult {
  readonly text: string;
  readonly pages: number;
  readonly ocrPages: number;
  readonly confidence: number | null;
}
export interface ReadOptions {
  readonly signal?: AbortSignal;
  readonly language?: 'eng' | 'spa' | 'eng+spa';
  readonly rotation?: number;
  readonly onProgress?: (message: string) => void;
}
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export function validateDocumentFile(
  file: Pick<File, 'size' | 'name' | 'type'>,
): 'text' | 'pdf' | 'image' {
  if (file.size === 0) throw new Error('This file is empty. Choose another file.');
  if (file.size > MAX_FILE_BYTES) throw new Error('Choose a file no larger than 20 MB.');
  if (file.type === 'text/plain' || /\.txt$/iu.test(file.name)) return 'text';
  if (file.type === 'application/pdf' || /\.pdf$/iu.test(file.name)) return 'pdf';
  if (
    /^image\/(jpeg|png|webp|bmp)$/iu.test(file.type) ||
    /\.(jpg|jpeg|png|webp|bmp)$/iu.test(file.name)
  )
    return 'image';
  throw new Error('Choose a JPEG, PNG, WebP, PDF or TXT file. Export HEIC photos as JPEG first.');
}
function aborted(signal?: AbortSignal) {
  if (signal?.aborted)
    throw new DOMException('Scanning cancelled. Your original text is unchanged.', 'AbortError');
}
/** All pixels are decoded in this tab and passed to a same-origin OCR worker. No upload API exists here. */
export async function readDocument(
  file: File,
  options: ReadOptions = {},
): Promise<ReadDocumentResult> {
  const kind = validateDocumentFile(file);
  aborted(options.signal);
  let worker: Worker | undefined;
  let initializing: Promise<Worker> | undefined;
  let rejectInitialization: ((reason: Error) => void) | undefined;
  const stop = () => {
    rejectInitialization?.(new DOMException('Scanning cancelled.', 'AbortError'));
    void worker?.terminate();
  };
  options.signal?.addEventListener('abort', stop, { once: true });
  let ocrPages = 0;
  const confidences: number[] = [];
  async function scan(canvas: HTMLCanvasElement): Promise<string> {
    aborted(options.signal);
    if (!initializing) {
      const languages = (options.language ?? 'eng+spa').split('+');
      if (import.meta.env.DEV)
        for (const language of languages) {
          const response = await fetch(
            `${import.meta.env.BASE_URL}ocr/lang/${language}.traineddata.gz`,
            { method: 'HEAD', signal: options.signal ?? null },
          );
          if (!response.ok || response.headers.get('content-type')?.includes('text/html'))
            throw new Error(
              'Local scanning files are unavailable. Reload the app online once, then retry.',
            );
        }
      let expired = false;
      const failure = new Promise<Worker>((_, reject) => {
        rejectInitialization = reject;
      });
      const timer = setTimeout(() => {
        expired = true;
        rejectInitialization?.(
          new Error('Local scanning took too long to start. Reload the app and try again.'),
        );
      }, 90000);
      const creating = createWorker(options.language ?? 'eng+spa', 1, {
        workerPath: new URL(import.meta.env.BASE_URL + 'ocr/worker.min.js', location.origin).href,
        corePath: new URL(import.meta.env.BASE_URL + 'ocr/core/', location.origin).href,
        langPath: new URL(import.meta.env.BASE_URL + 'ocr/lang/', location.origin).href,
        workerBlobURL: false,
        cacheMethod: 'none',
        errorHandler: () =>
          rejectInitialization?.(
            new Error(
              'Local OCR could not start. Reload the app and retry with a smaller, clear photo.',
            ),
          ),
        logger: (message) => {
          if (!options.signal?.aborted)
            options.onProgress?.(
              `Local scan · ${message.status}${typeof message.progress === 'number' ? ' ' + Math.round(message.progress * 100) + '%' : ''}`,
            );
        },
      });
      void creating
        .then((created) => {
          if (expired || options.signal?.aborted) void created.terminate();
        })
        .catch(() => {});
      initializing = Promise.race([creating, failure]).finally(() => {
        clearTimeout(timer);
        rejectInitialization = undefined;
      });
    }
    worker = await initializing;
    aborted(options.signal);
    const { data } = await worker.recognize(canvas);
    aborted(options.signal);
    ocrPages++;
    confidences.push(data.confidence);
    return data.text.trim();
  }
  try {
    if (kind === 'text') {
      const text = await file.text();
      aborted(options.signal);
      if (text.length > 200000) throw new Error('Use up to 200,000 characters per review.');
      if (!text.trim()) throw new Error('This file has no text.');
      return { text, pages: 1, ocrPages: 0, confidence: null };
    }
    if (kind === 'image') {
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(file);
      } catch {
        throw new Error('This photo could not be opened. Try a clear JPEG or PNG.');
      }
      const angle = (((options.rotation ?? 0) % 360) + 360) % 360;
      const rotated = angle === 90 || angle === 270;
      const scale = Math.min(1, 2600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((rotated ? bitmap.height : bitmap.width) * scale));
      canvas.height = Math.max(1, Math.round((rotated ? bitmap.width : bitmap.height) * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        bitmap.close();
        throw new Error('This browser cannot prepare the photo.');
      }
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((angle * Math.PI) / 180);
      context.drawImage(
        bitmap,
        (-bitmap.width * scale) / 2,
        (-bitmap.height * scale) / 2,
        bitmap.width * scale,
        bitmap.height * scale,
      );
      bitmap.close();
      try {
        const text = await scan(canvas);
        if (text.length < 5)
          throw new Error(
            'No readable text found. Retake the photo with better light and fill the frame.',
          );
        return { text, pages: 1, ocrPages, confidence: confidences[0] ?? null };
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
    const pdfjs = await import('pdfjs-dist');
    const { default: pdfWorker } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const cancelPdf = () => {
      void task.destroy();
    };
    options.signal?.addEventListener('abort', cancelPdf, { once: true });
    try {
      const pdf = await task.promise;
      if (pdf.numPages > 12)
        throw new Error('Use up to 12 pages per review. Split longer packets first.');
      const pages: string[] = [];
      for (let number = 1; number <= pdf.numPages; number++) {
        aborted(options.signal);
        options.onProgress?.(`Reading page ${number} of ${pdf.numPages} on this device…`);
        const page = await pdf.getPage(number);
        const content = await page.getTextContent();
        let text = content.items
          .map((item) =>
            'str' in item ? item.str + ('hasEOL' in item && item.hasEOL ? '\n' : ' ') : '',
          )
          .join('')
          .trim();
        if (text.length < 30) {
          const base = page.getViewport({ scale: 1 });
          const scale = Math.min(2, 2600 / Math.max(base.width, base.height));
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Cannot prepare scanned PDF.');
          try {
            await page.render({ canvas, canvasContext: context, viewport }).promise;
            text = await scan(canvas);
          } finally {
            canvas.width = 0;
            canvas.height = 0;
          }
        }
        if (text.length < 5)
          throw new Error(`Page ${number} has no readable text. No partial document was imported.`);
        pages.push(`--- Source page ${number} ---\n${text}`);
        page.cleanup();
        if (pages.join('\n\n').length > 200000)
          throw new Error('This document exceeds 200,000 characters. Choose a smaller section.');
      }
      return {
        text: pages.join('\n\n'),
        pages: pages.length,
        ocrPages,
        confidence: confidences.length ? Math.min(...confidences) : null,
      };
    } finally {
      options.signal?.removeEventListener('abort', cancelPdf);
      await task.destroy();
    }
  } catch (error) {
    aborted(options.signal);
    throw error;
  } finally {
    options.signal?.removeEventListener('abort', stop);
    if (worker) await worker.terminate();
    else if (initializing) void initializing.then((created) => created.terminate()).catch(() => {});
  }
}
