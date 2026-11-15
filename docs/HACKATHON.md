# Hackathon evidence and demo

## Problem and audience

Adults and caregivers leaving hospital need to compare long discharge packets with medication instructions, preserve the original wording and prepare questions for their care team. MedBrige focuses on this review and handoff, rather than claiming autonomous medical decision-making.

## Judging criteria

| Criterion                    | Demonstrated behavior                                                                                                         | Evidence                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Technological implementation | On-device OCR, local privacy boundary, Firebase AI Logic routing, App Check, exact evidence checks                            | `src/services/readDocument.ts`, `hybridAi.ts`, `firebase.ts`, tests   |
| Coherent design              | Intake → privacy review → medication review → personal log → encrypted handoff                                                | Working responsive screens; screenshots in docs                       |
| Credible impact              | Photos and source documents stay local; uncertain instructions stay visible; family can carry an encrypted copy               | Real local OCR fixture run; source quotes; password-protected handoff |
| Quality of idea              | Treats privacy and source evidence as part of the product flow; uses hybrid inference only after an inspectable text boundary | Consent revocation and decimal-boundary tests                         |

## Suggested five-minute demo

1. Open Documents and choose the fictional photo. Show the photo preview, rotation and local scan.
2. Compare OCR text with the original. Show the decimal dose and locally masked identifiers.
3. Explain private mode and demonstrate that an unavailable local model stops without cloud fallback.
4. On a supported Chrome Nano 4 device, record a real Firebase AI Logic local result. Then show consented hybrid fallback if available. Never substitute the hand-authored example for this evidence.
5. Review an entry, enter a synthetic time, confirm it and log a check-in on Today.
6. Add a care-team question, export an encrypted handoff and restore it. Show that restored medicines require review again.

## Evidence still needed before submission

- Verified Gemini Nano 4 execution through Firebase AI Logic on a supported Chrome device.
- Completed: real Firebase AI Logic cloud fallback with temporary App Check debug attestation, followed by token revocation. Production-domain reCAPTCHA must still be tested after deployment is approved.
- Physical camera testing on the actual phone(s) shown in the video.
- A short user test with a caregiver using synthetic material; report observations without inventing outcomes.

No prize, medical benefit, hospital-readmission reduction, anonymity guarantee or compliance certification is asserted.

## Actual test record

- 44 service tests passed.
- Real local OCR in Node and browser passed at 95% reported confidence on the synthetic fixture; the scanned-PDF browser path also passed.
- Browser: source preview, local redaction, consent, reviewed times, taken logging, encrypted saving, failed password, successful restore, mandatory re-review and manual source validation passed.
- A real Firebase cloud result was accepted with SDK-reported cloud provenance; no original photo was supplied to the model.
- The in-app browser rejected on-device initialization. A separate Chrome private-mode attempt did not produce an accepted result; specific Nano 4 execution remains unverified.
- Original photos and raw source text were not saved in the encrypted care snapshot.
