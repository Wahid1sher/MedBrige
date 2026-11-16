# MedBrige

**A clearer way home.** A responsive web/PWA companion for reviewing discharge instructions, building a personal care log and making a private caregiver handoff.

The research app targets the **Web / Chrome** track of #BuildHybridAI. Generative extraction uses **Firebase AI Logic**. Photos are decoded and scanned locally with bundled Tesseract WebAssembly; the AI interface accepts reviewed, redacted **text only**. Original photos never enter a Firebase AI prompt or Firestore.

## What works

- Photo upload, rotation, local English/Spanish OCR, PDF text extraction and local OCR for scanned PDF pages.
- Camera capture with preview, discard, permission/error handling and camera-track cleanup. Phones may use their native camera picker.
- Editable source text, live local identifier redaction, exact outgoing preview and explicit, revocable cloud permission.
- Firebase AI Logic `ONLY_ON_DEVICE` and consented `PREFER_ON_DEVICE` routing, SDK-reported inference source, cancellation and overlapping sections for long documents.
- Verbatim source evidence checks, including decimal and word boundaries. Any invalid section rejects the whole result.
- Manual source entry when local AI is unavailable. Hand-authored examples are labeled and never presented as AI output.
- Per-medicine human review, user-entered care-team-confirmed times, daily taken/later logging, undo and filters. No dosing times are inferred.
- Care-team questions, plain-text care notes, encrypted handoff files and explicit encrypted device saving. Imports require review again.
- AES-GCM encryption with PBKDF2-derived keys, random salt/nonce and payload validation. Photos and original documents are excluded from saved care copies.
- Responsive desktop navigation and mobile bottom tabs; a self-hosted offline app shell and OCR assets.
- A local-only MV3 selected-text privacy-review extension. Its text is never auto-scraped or auto-uploaded.

## Run

Use Node 22.12+ (development verified on Node 26).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5190/. The first preparation copies OCR workers, WebAssembly and language files from installed packages into `public/ocr/`. These generated files are not committed. Scanning, manual review and encrypted handoff work without Firebase credentials.

For AI, copy `.env.example` to `.env.local` and supply your Firebase public web configuration and reCAPTCHA Enterprise site key. Enable Firebase AI Logic with the Gemini Developer API and register App Check for the web app. Enforce App Check in the Firebase console. Never place a service-account key or a debug token in a committed file.

```sh
npm test
node tests/ocr.integration.mjs
npm run build
npm run preview
```

`dist/` is the PWA; `dist-extension/` is the selected-text Chrome extension. To serve the app under a subpath, set `MEDBRIGE_BASE` before building. The offline cache contains build assets only, including static OCR models and the fictional example image. It never runtime-caches patient files, text, Firebase requests or AI responses.

## Firebase and hackathon requirements

- **Firebase AI Logic:** all generative extraction flows through the official SDK. Local OCR and deterministic validation are clearly separate.
- **App Check:** a reCAPTCHA Enterprise provider is installed before constructing AI instances. A production site key is required for cloud fallback. A localhost-only development debug switch is available when `VITE_APPCHECK_DEBUG=true`; register the browser-generated token yourself in Firebase. It is gated out of production builds. No secret token is embedded.
- **Web on-device model:** Chrome selects the installed Prompt API model. The code uses the Firebase on-device route, but this alone does not prove a particular Gemini Nano revision. Capture an actual **Gemini Nano 4** run on a supported judging device before claiming this requirement complete.
- **Other Firebase products:** Auth and Firestore initialization are available, but this version deliberately uses encrypted care files for caregiver handoff. It does not claim real-time Firestore sharing or implemented account flows. Remote Config is not required by the listed rules and is not claimed.
- **Platform:** this repository delivers responsive web/PWA and an MV3 local privacy surface. It does not contain signed native iOS/Android packages or a verified Apple Foundation Models integration.

Official references: [hybrid web setup](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started), [inference configuration](https://firebase.google.com/docs/ai-logic/hybrid/web/configuration-options), [App Check](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).

## Verification and limitations

57 automated tests cover redaction, consent expiry/revocation, private routing, connectivity changes, source-evidence rejection, long-document sections, file limits, cancellation, encryption, wrong passphrases, tampering, schedule validation and handoff filtering. They also cover native model cancellation, fresh retry sessions, the local-only readiness probe, rejection of missing dose units/forms, progressing downloads, separate reply deadlines, duplicate-job prevention and mode-specific cloud consent. A real local OCR integration test reads the fictional fixture and checks name, MRN and decimal dose. Browser testing verified photo OCR at 95% reported confidence, redaction, reviewed schedule creation, taken logging, encrypted saving and wrong/correct-passphrase restore, scanned-PDF OCR, camera initialization/close, valid/invalid manual source entry and an actual encrypted Chrome download/decryption.

Local inference was also verified in desktop Chrome through Firebase AI Logic: a short readiness probe and a synthetic one-medicine extraction completed with `on-device` provenance. The accepted draft preserved 250 mg, 1 capsule, by mouth, every 8 hours and 5 days from the supplied fictional test text. This proves the local route, not a specific Nano 4 revision. A **Check local AI** button tests a fixed short prompt without sending any document text. Timeout messages distinguish setup, extraction and user cancellation. Standard JSON Schema constraints require a non-null medicine name, bound output size and permit null optional fields; all generated evidence still undergoes independent source validation.

The home screen includes a linked, qualified finding from Forster et al. (2003), plus the shared local AI check. Sidebar privacy controls offer **Strict local** (no cloud), **Balanced** (local first with explicitly approved fallback) and **Best quality** (cloud first with separate explicit approval). Mobile home includes the same controls. Changing source text or choosing Strict local revokes cloud permission. No timeout automatically changes the privacy mode. Actual SDK provenance is shown only after a result returns; the interface does not invent a cloud-fallback status.

Model setup has a progress-aware deadline: a moving download can continue, but 120 seconds without new progress ends the check; total setup is capped at 30 minutes. The first streamed reply has its own 90-second deadline. A shared workspace guard prevents overlapping extraction/probe jobs. These controls cannot repair a stalled browser model backend. A successful first-token check verifies local responsiveness, not a completed medication extraction or model version. Chrome's **Gemma 4 preview** is not represented as a verified **Gemini Nano 4** installation; model-version confirmation remains necessary.

A real consented Firebase AI Logic cloud extraction was verified with temporary App Check debug attestation: two medicines were accepted after exact evidence validation. The temporary token was revoked at the user�s request and is not in this repository. Normal reCAPTCHA App Check still protects production; localhost testing requires registering your own debug token. Specific Nano 4 execution, physical phone document capture and background notifications remain separate verification items. Simulated engine tests are not live model runs.

This app is a **research prototype, not a clinically validated product**. It does not diagnose, choose treatment, check drug interactions, identify real pills or claim HIPAA compliance. OCR and PII scrubbing can miss information. Review every line and consult the care team. Illustration sizes are visual examples, not physical measurements. Dose logging is a personal record, not dose advice or a background alarm.

Care data lives in session memory unless you explicitly save an encrypted copy. Saved files exclude source photos and original documents. Anyone with the passphrase can decrypt a care copy; lost passphrases cannot be recovered. Imported entries need review again before entering the daily plan.

## Project layout

- `src/services/`: Firebase AI, local OCR, PII scrubber, evidence checks and encrypted care data.
- `src/components/`: intake/camera, privacy review, medicine review, personal log and caregiver handoff.
- `src/state/`: in-memory care workspace.
- `extension/`: selected-text MV3 surface.
- `tests/`: unit and OCR integration checks, synthetic scanned-PDF fixture.
- `docs/`: screenshots, licenses and hackathon evidence.

The MedBrige logo combines a discharge page and a care heart: clearer instructions, with a person behind them.
