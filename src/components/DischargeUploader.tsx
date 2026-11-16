import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Camera,
  ArrowUpRight,
  LoaderCircle,
  LockKeyhole,
  RotateCw,
  X,
  Plus,
} from 'lucide-react';
import {
  readDocument,
  validateDocumentFile,
  type ReadDocumentResult,
} from '../services/readDocument';
import { CameraCapture } from './CameraCapture';
interface Props {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSample: () => void;
  readonly compact?: boolean;
  readonly onOpenEditor?: () => void;
  readonly onPendingChange?: (pending: boolean) => void;
}
export function DischargeUploader({ value, onChange, onSample, onPendingChange }: Props) {
  const input = useRef<HTMLInputElement>(null),
    nativeCamera = useRef<HTMLInputElement>(null),
    pending = useRef<AbortController | null>(null),
    version = useRef(0);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [progress, setProgress] = useState(''),
    [dragging, setDragging] = useState(false),
    [camera, setCamera] = useState(false),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(''),
    [rotation, setRotation] = useState(0),
    [language, setLanguage] = useState<'eng' | 'spa' | 'eng+spa'>('eng+spa'),
    [append, setAppend] = useState(true),
    [lastScan, setLastScan] = useState<ReadDocumentResult | null>(null);
  useEffect(
    () => () => {
      version.current++;
      pending.current?.abort();
    },
    [],
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(() => {
    onPendingChange?.(busy || camera || !!file);
    return () => onPendingChange?.(false);
  }, [busy, camera, file, onPendingChange]);
  async function scan(selected: File, angle = 0) {
    if (busy) return;
    const id = ++version.current,
      controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError('');
    setProgress('Preparing a private scan…');
    try {
      const result = await readDocument(selected, {
        signal: controller.signal,
        language,
        rotation: angle,
        onProgress: setProgress,
      });
      if (id !== version.current || controller.signal.aborted) return;
      const text =
        append && value.trim()
          ? `${value}\n\n--- Additional source ---\n${result.text}`
          : result.text;
      if (text.length > 200000)
        throw new Error('This would exceed 200,000 characters. Start a separate review.');
      onChange(text);
      setLastScan(result);
      setFile(null);
      setPreview('');
      setProgress('Text added. Check spelling, decimal points and units against the original.');
    } catch (e) {
      if (id === version.current && !controller.signal.aborted)
        setError(e instanceof Error ? e.message : 'Could not scan this document.');
    } finally {
      if (id === version.current) {
        setBusy(false);
        pending.current = null;
      }
    }
  }
  function select(selected: File | undefined) {
    if (!selected || busy) return;
    setError('');
    try {
      const kind = validateDocumentFile(selected);
      setRotation(0);
      if (kind === 'image') {
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
      } else void scan(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid file.');
    }
    if (input.current) input.current.value = '';
    if (nativeCamera.current) nativeCamera.current.value = '';
  }
  function cancel() {
    version.current++;
    pending.current?.abort();
    pending.current = null;
    setBusy(false);
    setProgress('Scan cancelled. Your original text is unchanged.');
  }
  return (
    <section className="card intake-card" aria-busy={busy}>
      <div className="card-heading">
        <div>
          <span className="section-kicker">PHOTO TO PRIVATE TEXT</span>
          <h2>Your discharge document</h2>
        </div>
        <span className="icon-tile">
          <FileText size={20} />
        </span>
      </div>
      <p className="supporting">
        Scan a photo, read a PDF or paste the original words. Photos are never sent to cloud AI.
      </p>
      <div className="intake-actions" data-tour="capture">
        <button className="button secondary" disabled={busy} onClick={() => input.current?.click()}>
          <Upload size={17} />
          Upload file
        </button>
        <button
          className="button dark"
          disabled={busy}
          onClick={() => {
            if (matchMedia('(pointer: coarse)').matches) nativeCamera.current?.click();
            else setCamera(true);
          }}
        >
          <Camera size={18} />
          Take a photo
        </button>
      </div>
      <input
        ref={input}
        type="file"
        hidden
        accept=".txt,.pdf,.jpg,.jpeg,.png,.webp,.bmp,text/plain,application/pdf,image/jpeg,image/png,image/webp,image/bmp"
        onChange={(e) => select(e.target.files?.[0])}
      />
      <input
        ref={nativeCamera}
        type="file"
        hidden
        accept="image/*"
        capture="environment"
        onChange={(e) => select(e.target.files?.[0])}
      />
      {file ? (
        <div className="photo-review">
          <div className="photo-preview">
            <img
              src={preview}
              alt="Local document preview"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          </div>
          <div className="photo-tools">
            <span>{file.name}</span>
            <button
              disabled={busy}
              aria-label="Rotate photo clockwise"
              onClick={() => setRotation((rotation + 90) % 360)}
            >
              <RotateCw size={17} />
            </button>
            <button
              disabled={busy}
              aria-label="Remove selected photo"
              onClick={() => {
                setFile(null);
                setPreview('');
              }}
            >
              <X size={17} />
            </button>
          </div>
          <button className="button dark" disabled={busy} onClick={() => void scan(file, rotation)}>
            {busy ? <LoaderCircle size={17} className="spin" /> : <LockKeyhole size={16} />}Scan
            photo on this device
          </button>
        </div>
      ) : (
        <button
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            select(e.dataTransfer.files[0]);
          }}
        >
          <span className="upload-icon">
            {busy ? <LoaderCircle size={26} className="spin" /> : <Plus size={26} />}
          </span>
          <strong>{busy ? 'Reading locally…' : 'Drop a document or photo'}</strong>
          <small>JPEG, PNG, WebP, PDF or TXT · 20 MB · 12 PDF pages</small>
        </button>
      )}
      <div className="import-options">
        <label>
          Scan language
          <select
            value={language}
            disabled={busy}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
          >
            <option value="eng+spa">English + Spanish</option>
            <option value="eng">English</option>
            <option value="spa">Spanish</option>
          </select>
        </label>
        {!!value.trim() && (
          <label className="append-option">
            <input
              type="checkbox"
              disabled={busy}
              checked={append}
              onChange={(e) => setAppend(e.target.checked)}
            />
            Add to current document
          </label>
        )}
      </div>
      <div className="scan-progress" role="status">
        {progress}
        {busy && <button onClick={cancel}>Cancel scan</button>}
      </div>
      {lastScan && (
        <p className="ocr-note">
          {lastScan.pages} page{lastScan.pages === 1 ? '' : 's'} ·{' '}
          {lastScan.ocrPages ? 'Local OCR' : 'Local text read'}
          {lastScan.confidence !== null
            ? ` · OCR confidence ${Math.round(lastScan.confidence)}%`
            : ''}
          . OCR can misread names, doses and decimal points. Check every line.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="textarea-label">
        <label htmlFor="raw-document">Or paste your discharge text</label>
        <span>{value.length.toLocaleString()} / 200,000</span>
      </div>
      <textarea
        data-tour="source-text"
        id="raw-document"
        value={value}
        maxLength={200000}
        disabled={busy}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        spellCheck={false}
        placeholder="Paste your discharge instructions here…"
        aria-describedby="raw-help"
      />
      <p className="input-note" id="raw-help">
        <LockKeyhole size={14} />
        Your original text and photos stay in this session.
      </p>
      <button
        className="text-button"
        disabled={busy}
        onClick={() => {
          void fetch(import.meta.env.BASE_URL + 'example-discharge.png')
            .then((r) => r.blob())
            .then((blob) =>
              select(new File([blob], 'fictional-discharge.png', { type: 'image/png' })),
            )
            .catch(() => setError('Could not load the example photo.'));
        }}
      >
        Try a fictional photo scan <Camera size={15} />
      </button>
      <button className="text-button" disabled={busy} onClick={onSample}>
        Use a fictional example <ArrowUpRight size={15} />
      </button>
      {camera && <CameraCapture onPhoto={select} onClose={() => setCamera(false)} />}
    </section>
  );
}
