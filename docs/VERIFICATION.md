# MedBrige verification � November 15, 2026

## Passed automated checks

- 48 Vitest service tests. This includes cancellation of an engine that ignores AbortSignal, native model cancellation and retry isolation, probe provenance, rejection of missing dose units/forms, retention of route/duration/status, exact decimal evidence checks, consent revocation between sections, strict private routing, encrypted round trips, wrong passphrases, tampering, schedule limits and handoff filtering.
- Actual local OCR integration: synthetic image read with 95% reported confidence; expected name, MRN, 0.5 mg decimal and second medicine matched.
- TypeScript, production PWA build and MV3 extension build.

## Observed in the browser

- Photo preview and actual local OCR succeeded. Four identifiers were masked in the resulting text.
- A one-page scanned PDF was rendered and OCR-read locally, also at 95% reported confidence. Source-page labeling and decimal wording were preserved.
- Camera dialog opened; capture became enabled after live media initialization; closing returned to intake. No physical personal document was photographed during the test. Physical phone capture remains a separate test.
- Private mode in the in-app browser stopped with a local-model-unavailable message rather than sending document text to cloud AI.
- A real Hybrid request through Firebase AI Logic succeeded using an explicitly approved synthetic source and temporary App Check debug attestation. The SDK reported cloud inference. The UI accepted two entries: Examplemed 0.5 mg and Samplemed 10 mg, each with exact source evidence. This was not the hand-authored sample review.
- The App Check debug credential was revoked through the Firebase App Check API after verification, per the user's instruction. No token was committed. Development debug mode was then disabled.
- A reviewed 08:00 time entered Today only after user confirmation. Logging changed the count from 0/1 to 1/1, with undo available.
- Encrypted device saving worked. A wrong password returned an error without importing data. The correct password showed a restore preview; restoring cleared check-ins and required medicine review again.
- Manual source entry rejected 5 mg when the quote contained 0.5 mg; the corrected exact-source entry was accepted.
- Responsive source/preview switching and desktop/mobile navigation were checked. The narrow-phone layout was adjusted for time controls.

## Still unverified / not claimed

- A completed Gemini Nano 4 run through Firebase AI Logic. A separate Chrome private-mode attempt did not produce an accepted result, and browser policy prevented opening model-internals pages. Do not claim the exact local model revision from feature detection.
- Production-domain reCAPTCHA attestation after deployment. Publishing was not authorized in this run; existing Firebase-hosted apps were not changed.
- Physical Android/iPhone document capture, background notifications, signed native apps, clinical validity, drug-interaction coverage, anonymous-data guarantees or HIPAA compliance.

All test documents are synthetic. Service-engine mocks are not represented as real model executions.

## Additional final checks

- Real Chrome UI: Cancel extraction returned the interface to its idle state with no partial result saved.
- An encrypted handoff was actually downloaded by Chrome. The downloaded file was decrypted outside the browser using the test passphrase; it contained one reviewed synthetic Examplemed entry, the correct 0.5 mg strength and the manually entered 08:00 time. Its saved ciphertext did not contain the medicine name in plaintext.

## Local timeout investigation

- A fixed short prompt completed through Firebase AI Logic with `ON_DEVICE` provenance in desktop Chrome. It used no document text and allowed no cloud fallback.
- A previous nested response grammar allowed a null medicine name. A local reply contained an all-null entry (133 characters), correctly rejected by validation. The local schema now uses standard JSON Schema null branches, requires a non-null name and bounds output lengths/counts.
- Native Chrome session and prompt options now receive the request AbortSignal. Retry models are scoped to each signal so a cancelled session is not reused. Completed requests are also aborted for cleanup.
- An early synthetic extraction omitted units/forms. Independent validation now rejects bare numeric strength/dose and dosage forms misclassified as routes. Prompt/schema guidance was tightened without weakening exact source checks.
- The revised real local extraction accepted a synthetic Amoxicillin entry preserving **250 mg**, **1 capsule**, **by mouth**, **every 8 hours** and **5 days**. This is a fictional test instruction, not medication advice. Screenshot: `local-ai-verified.png`.
- The complete original fictional discharge sample then also passed real local inference: Examplemed **0.5 mg**, **1 tablet**, **by mouth**, **once daily**, **Continue**; Samplemed **10 mg**, **1 tablet**, **by mouth**, **every 12 hours**, **5 days**. The medicine review displayed **Firebase AI Logic · on-device** and required human review. Cloud permission remained off.
- This verifies local execution, not Nano 4 specifically. The user's Chrome report listed `nano_v3_gpu_component` as ready; no Nano 4 claim is made.
