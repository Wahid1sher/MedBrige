import { cp, readFile, writeFile } from 'node:fs/promises';
import ts from 'typescript';
await cp('extension/manifest.json', 'dist-extension/manifest.json');
const source = await readFile('extension/background.ts', 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
});
await writeFile('dist-extension/background.js', output.outputText);
console.log(
  'MV3 local-only extension built. No remote code, cloud AI, or persistent portal permissions.',
);
