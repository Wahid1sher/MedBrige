# MedBrige verification � November 15, 2026

## Passed automated checks

- 44 Vitest service tests. This includes cancellation of an engine that ignores AbortSignal, retention of route/duration/status, exact decimal evidence checks, consent revocation between sections, strict private routing, encrypted round trips, wrong passphrases, tampering, schedule limits and handoff filtering.
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
