import { scrubPii } from '../src/services/piiScrubber';
// The content script imports ONLY the local scrubber, never Firebase/cloud code.
// It reads the current selection after an explicit click, not the portal DOM.
const ID = 'medbridge-local-review-root';
if (document.getElementById(ID)) document.getElementById(ID)?.remove();
else {
  const host = document.createElement('div');
  host.id = ID;
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = `:host{all:initial;position:fixed;bottom:24px;right:24px;z-index:2147483647;font:14px/1.7 system-ui,sans-serif;color:#0F172A}*{box-sizing:border-box}.panel{width:min(410px,calc(100vw - 30px));max-height:85vh;overflow:auto;background:#fffdf8;border:1px solid #dce7f9;border-top:6px solid #4f88dd;border-radius:22px;padding:25px;box-shadow:0 15px 70px #173d4230}h2{font-size:22px;margin:0 0 8px;letter-spacing:-.5px}p{font-size:13px;color:#526575}button{font:inherit;border:0;border-radius:10px;background:#112641;color:white;padding:10px 14px;cursor:pointer;margin:4px 5px 4px 0;min-height:44px}button.close{float:right;padding:4px 10px;background:#f1f5f9;color:#475569}textarea{width:100%;min-height:200px;font:12px/1.8 monospace;padding:12px;border:1px solid #dce5e9;background:#f8fafc;border-radius:7px;color:#1e5250;margin:14px 0}small{display:block;color:#64748b;font-size:11px}.notice{padding:10px;background:#edf3ff;border-radius:10px;color:#315e9b}`;
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'MedBrige local privacy review');
  const close = document.createElement('button');
  close.className = 'close';
  close.textContent = '×';
  close.ariaLabel = 'Close MedBrige';
  close.onclick = () => host.remove();
  const heading = document.createElement('h2');
  heading.textContent = 'MedBrige.';
  const description = document.createElement('p');
  description.textContent =
    'Select document text on this page, then review a locally scrubbed copy. No text is sent to a server.';
  const scan = document.createElement('button');
  scan.textContent = 'Review selected text';
  const status = document.createElement('p');
  status.className = 'notice';
  status.textContent = 'Waiting for your selection.';
  status.setAttribute('role', 'status');
  const preview = document.createElement('textarea');
  preview.readOnly = true;
  preview.ariaLabel = 'Locally redacted selection';
  const copy = document.createElement('button');
  copy.textContent = 'Download reviewed text';
  copy.disabled = true;
  const warning = document.createElement('small');
  warning.textContent =
    'Scrubbing can miss identifiers. Review all text before sharing. This extension does not check medicines or provide clinical advice. It does not claim integration with or endorsement by Epic or MyChart.';
  const consent = document.createElement('label');
  const checked = document.createElement('input');
  checked.type = 'checkbox';
  consent.append(
    checked,
    document.createTextNode(' I checked this preview for remaining identifiers.'),
  );
  let current: string | null = null;
  scan.onclick = () => {
    checked.checked = false;
    copy.disabled = true;
    current = null;
    const selected = window.getSelection()?.toString() ?? '';
    if (!selected.trim()) {
      status.textContent = 'Select the discharge text first. No full-page scraping is performed.';
      preview.value = '';
      return;
    }
    try {
      const result = scrubPii(selected);
      preview.value = result.text;
      current = result.cloudBlockReasons.length ? null : result.text;
      status.textContent = `${result.redactions.length} local redactions. Review is still required.${result.cloudBlockReasons.length ? ' Invisible control characters need to be removed.' : ''}`;
    } catch {
      preview.value = '';
      status.textContent = 'The selection is too long. Choose up to 200,000 characters.';
    }
  };
  checked.onchange = () => {
    copy.disabled = !checked.checked || current === null;
  };
  copy.onclick = () => {
    if (!checked.checked || current === null) return;
    const url = URL.createObjectURL(new Blob([current], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medbridge-reviewed-text.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  panel.append(close, heading, description, scan, status, preview, warning, consent, copy);
  shadow.append(style, panel);
  document.documentElement.append(host);
}
