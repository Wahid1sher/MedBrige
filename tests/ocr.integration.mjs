import { createWorker } from 'tesseract.js';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const worker = await createWorker('eng+spa', 1, {
  langPath: resolve('public/ocr/lang'),
  cacheMethod: 'none',
});
try {
  const { data } = await worker.recognize(resolve('public/example-discharge.png'));
  assert.match(data.text, /Examplemed\s+0\.5\s*mg/i);
  assert.match(data.text, /Samplemed\s+10\s*mg/i);
  assert.match(data.text, /Alex Example/i);
  assert.match(data.text, /DEMO-123456/i);
  console.log(
    JSON.stringify({
      result: 'Local OCR passed',
      confidence: data.confidence,
      checks: ['name', 'MRN', 'decimal dose', 'second medicine'],
    }),
  );
} finally {
  await worker.terminate();
}
