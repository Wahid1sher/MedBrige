# MedBrige — The Day as a Sky

Updated November 15, 2026 from the user's supplied phone reference.

## Visual direction

The user reference leads the design: an immersive blue sky, a yellow sun on a daily arc, bold rounded typography, deep navy actions and warm white cards. Desktop places the arc beside the medication card; phones place the card directly below it. The same palette and rounded surfaces continue through Documents, Medicines, Privacy and Care circle. The navigation calls the home screen Today.

The broad skill search returned a marketing/neumorphic pattern that does not fit this product and was rejected. A verified minimal/flat application reference informed clarity and hierarchy; the user's sky gradient takes precedence over generic style recommendations.

## Tokens

- Sky: #3169B7 to #3974C3, fading to #CBDCEB and #F3F6FC.
- Ink/actions: #10243F / #112641.
- Sun: #FFDC7E. Warm card: #FFFDF8.
- Supporting blue: #315E9B; secondary text: #5B708C.
- Self-hosted DM Sans Variable, 800–850 for main headings, 400–700 for reading and controls.
- Cards 24–29px radius; action buttons pill-shaped; 44px primary touch targets.

## Interaction

Today initially shows an explicitly labeled fictional day with five invented medication entries. Timeline points, previous/next, mark taken, later feedback, reset and example toggle work in local component state. No real dose is logged; no notification is scheduled. Leaving Today resets that illustrative state. Turning off the example shows a real empty state connected to document intake.

Source-derived medication entries remain in the separate Medicines view. The example is not an extraction, prescription or interaction check. Real session counts only appear in the workspace links.

Document intake, source/private-preview switching, identity-bound cloud permission, edit revocation, source evidence and cancel-first confirmations are retained. Cloud AI, photo OCR and caregiver sharing remain clearly unconnected.

## Responsive and accessibility

Desktop navigation rail, four phone/tablet bottom tabs, safe-area padding, visible keyboard focus and reduced-motion support. Small arc labels use a dark blue backing. The sky is darker than the reference so white text remains readable. Patient text stays on white surfaces; no visual truncation of instructions is introduced. Views are checked for overflow at phone, tablet and desktop widths.

## Identity and navigation

MedBrige uses a sunrise over a bridge, with a golden sun and white bridge on navy. The desktop navigation shares the same continuous sky as the page. Its integrated 212px rail uses simple single-line navigation, a light active state, a quiet document action and an inline privacy link. The main content begins 28px from the rail; the former floating frame, promotional card and secondary labels are removed. At 900px and below it yields to the mobile header and four bottom tabs. User-facing product titles, PWA metadata and extension labels use the new spelling.
