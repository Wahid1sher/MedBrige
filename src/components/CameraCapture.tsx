import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, X } from 'lucide-react';
export function CameraCapture({
  onPhoto,
  onClose,
}: {
  onPhoto: (file: File) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null);
  const [error, setError] = useState(''),
    [ready, setReady] = useState(false),
    [photo, setPhoto] = useState<Blob | null>(null),
    [preview, setPreview] = useState('');
  useEffect(() => {
    dialog.current?.showModal();
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Live camera needs HTTPS and camera support. Use the photo picker instead.');
      return;
    }
    void navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1440 },
        },
        audio: false,
      })
      .then((result) => {
        if (cancelled) {
          result.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = result;
        if (video.current) {
          video.current.srcObject = result;
          void video.current.play().catch(() => setError('Press the video to start the camera.'));
        }
      })
      .catch((e) =>
        setError(
          e?.name === 'NotAllowedError'
            ? 'Camera permission was denied. You can still upload a photo.'
            : 'No camera is available. Try the photo picker on your phone.',
        ),
      );
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
    };
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function capture() {
    const el = video.current;
    if (!el?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(el, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.94),
    );
    canvas.width = 0;
    canvas.height = 0;
    if (blob) {
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
      stream.current?.getTracks().forEach((track) => track.stop());
    }
  }
  return (
    <dialog
      ref={dialog}
      className="capture-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="camera-title"
    >
      <header>
        <div>
          <span className="section-kicker">ON YOUR DEVICE</span>
          <h2 id="camera-title">A clearer picture.</h2>
        </div>
        <button className="icon-button" aria-label="Close camera" onClick={onClose}>
          <X size={21} />
        </button>
      </header>
      <p>Lay the page flat. Fill the frame and avoid shadows. Your photo stays on this device.</p>
      {error ? (
        <div className="camera-error" role="alert">
          <Camera size={32} />
          <p>{error}</p>
          <button className="button dark" onClick={onClose}>
            Back to upload
          </button>
        </div>
      ) : (
        <>
          {photo ? (
            <img
              src={preview}
              alt="Captured document preview, stored only in memory"
              className="camera-preview"
            />
          ) : (
            <video
              ref={video}
              autoPlay
              playsInline
              muted
              className="camera-preview"
              onLoadedMetadata={() => setReady(true)}
              onClick={() => void video.current?.play()}
            />
          )}
          <div className="camera-actions">
            {photo ? (
              <>
                <button className="button secondary" onClick={onClose}>
                  <RotateCcw size={16} />
                  Discard photo
                </button>
                <button
                  className="button dark"
                  onClick={() => {
                    onPhoto(new File([photo], 'camera-document.jpg', { type: 'image/jpeg' }));
                    onClose();
                  }}
                >
                  Use this photo
                </button>
              </>
            ) : (
              <button disabled={!ready} className="button dark" onClick={() => void capture()}>
                <Camera size={18} />
                Take photo
              </button>
            )}
          </div>
        </>
      )}
    </dialog>
  );
}
