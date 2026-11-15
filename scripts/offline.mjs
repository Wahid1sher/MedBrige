import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function list(dir, prefix = '') {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true }))
    if (entry.name !== 'sw.js')
      files.push(
        ...(entry.isDirectory()
          ? await list(dir + '/' + entry.name, prefix + entry.name + '/')
          : [prefix + entry.name]),
      );
  return files;
}
const files = await list('dist');
const hash = createHash('sha256')
  .update(await readFile('dist/index.html'))
  .digest('hex')
  .slice(0, 16);
await writeFile(
  'dist/sw.js',
  `const CACHE='medbridge-shell-${hash}';const FILES=${JSON.stringify(files)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(p=>new URL(p,self.registration.scope).href)))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('medbridge-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const base=new URL(self.registration.scope),u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==base.origin||!u.pathname.startsWith(base.pathname))return;const path=u.pathname.slice(base.pathname.length);if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match(new URL('index.html',base).href)));return;}if(FILES.includes(path))e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));});`,
);
console.log(
  'Offline shell generated. Only build assets are cached, including the PDF worker. No documents or AI responses.',
);
