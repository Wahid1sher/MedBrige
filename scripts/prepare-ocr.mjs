import { mkdir, copyFile, readdir } from 'node:fs/promises';
await mkdir('public/ocr/core', { recursive: true });
await mkdir('public/ocr/lang', { recursive: true });
await copyFile('node_modules/tesseract.js/dist/worker.min.js', 'public/ocr/worker.min.js');
for (const name of await readdir('node_modules/tesseract.js-core')) {
  if (name.endsWith('.wasm') || name.endsWith('.wasm.js'))
    await copyFile('node_modules/tesseract.js-core/' + name, 'public/ocr/core/' + name);
}
for (const lang of ['eng', 'spa'])
  await copyFile(
    `node_modules/@tesseract.js-data/${lang}/4.0.0/${lang}.traineddata.gz`,
    `public/ocr/lang/${lang}.traineddata.gz`,
  );
console.log('Local OCR worker, WebAssembly, and English/Spanish language files copied.');
