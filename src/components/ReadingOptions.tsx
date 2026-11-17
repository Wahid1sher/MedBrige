import { useEffect, useState } from 'react';
import { Type } from 'lucide-react';
const key = 'medbrige-reading-v1';
function saved() {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '{}');
    return { large: value.large === true, contrast: value.contrast === true };
  } catch {
    return { large: false, contrast: false };
  }
}
export function ReadingOptions() {
  const [options, setOptions] = useState(saved);
  useEffect(() => {
    document.documentElement.dataset.readingLarge = String(options.large);
    document.documentElement.dataset.readingContrast = String(options.contrast);
    try {
      localStorage.setItem(key, JSON.stringify(options));
    } catch {
      /* Preferences are optional. */
    }
  }, [options]);
  return (
    <details className="ws-reading">
      <summary>
        <Type size={17} />
        <span>Reading</span>
      </summary>
      <div>
        <strong>Reading & contrast</strong>
        <p>
          Adjust page text and contrast. Only these display preferences are remembered on this
          device.
        </p>
        <label>
          <input
            type="checkbox"
            checked={options.large}
            onChange={(e) => setOptions((o) => ({ ...o, large: e.target.checked }))}
          />
          Larger page text
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.contrast}
            onChange={(e) => setOptions((o) => ({ ...o, contrast: e.target.checked }))}
          />
          High contrast cards
        </label>
        <small>Privacy controls and tour keep their existing appearance.</small>
      </div>
    </details>
  );
}
