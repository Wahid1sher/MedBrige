/** Local-only text processing. This module has no Firebase or network imports. */
export type PiiCategory =
  'patient-name' | 'mrn' | 'date-of-birth' | 'phone' | 'ssn' | 'email' | 'address';
export type DetectionMethod = 'labeled-field' | 'pattern' | 'user-hint';
export interface Redaction {
  /** UTF-16 offsets in the original text; the original value is never copied. */
  readonly start: number;
  readonly end: number;
  readonly categories: readonly PiiCategory[];
  readonly methods: readonly DetectionMethod[];
  readonly replacement: string;
}
declare const scrubbedBrand: unique symbol;
declare const permitBrand: unique symbol;
export interface ScrubbedDocument {
  readonly [scrubbedBrand]: true;
  readonly id: string;
  readonly text: string;
  readonly redactions: readonly Redaction[];
  readonly inputCharacters: number;
  readonly reviewRequired: true;
  readonly warnings: readonly string[];
  readonly cloudBlockReasons: readonly string[];
}
export interface CloudPermit {
  readonly [permitBrand]: true;
  readonly documentId: string;
  readonly expiresAt: number;
  readonly scope: 'fallback' | 'cloud-first';
}
export interface ScrubOptions {
  readonly knownPatientNames?: readonly string[];
  readonly knownIdentifiers?: readonly string[];
}
interface Candidate {
  start: number;
  end: number;
  category: PiiCategory;
  method: DetectionMethod;
}
const issued = new WeakSet<object>();
const permits = new WeakMap<
  object,
  { document: ScrubbedDocument; expiresAt: number; scope: CloudPermit['scope'] }
>();
const LIMIT = 200_000;
const REVIEW_NOTICE =
  'Automated redaction can miss identifiers. Check every line before sharing. This is not a guarantee of anonymity or HIPAA compliance.';
const labels: readonly [PiiCategory, RegExp][] = [
  [
    'patient-name',
    /^[ \t]*(?:name|first\s+name|last\s+name|given\s+name|surname)\s*[:#=][ \t]*([^\r\n]+)/gimu,
  ],
  [
    'patient-name',
    /\b(?:patient(?:\s+name)?|name\s+of\s+patient|nombre(?:\s+del\s+paciente)?|paciente)\s*[:#=][ \t]*([^\r\n]+)/giu,
  ],
  [
    'mrn',
    /\b(?:MRN|medical\s+record(?:\s+(?:number|no\.?|ID))?|patient\s+(?:ID|number)|n[úu]mero\s+de\s+expediente)\s*[:#=][ \t]*([^\r\n]+)/giu,
  ],
  [
    'date-of-birth',
    /\b(?:DOB|D\.?O\.?B\.?|date\s+of\s+birth|birth\s*date|fecha\s+de\s+nacimiento)\s*[:#=][ \t]*([^\r\n]+)/giu,
  ],
  [
    'phone',
    /\b(?:phone(?:\s+number)?|telephone|tel[ée]fono|mobile|cell|fax)\s*[:#=][ \t]*([^\r\n]+)/giu,
  ],
  ['ssn', /\b(?:SSN|social\s+security(?:\s+(?:number|no\.?))?)\s*[:#=][ \t]*([^\r\n]+)/giu],
  [
    'address',
    /\b(?:home\s+address|mailing\s+address|address|direcci[óo]n)\s*[:#=][ \t]*([^\r\n]+)/giu,
  ],
];
const nextLabel =
  /[ \t]+(?=(?:DOB|MRN|SSN|patient(?:\s+name|\s+ID)?|phone|date\s+of\s+birth|address|email|sex|age)\s*[:#=])/iu;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class PrivacyError extends Error {
  constructor(
    readonly code:
      | 'INVALID_INPUT'
      | 'REVIEW_REQUIRED'
      | 'BLOCKED_TEXT'
      | 'INVALID_APPROVAL'
      | 'APPROVAL_EXPIRED',
    message: string,
  ) {
    super(message);
    this.name = 'PrivacyError';
  }
}

export function scrubPii(input: string, options: ScrubOptions = {}): ScrubbedDocument {
  if (typeof input !== 'string' || input.length > LIMIT)
    throw new PrivacyError(
      'INVALID_INPUT',
      `Use at most ${LIMIT.toLocaleString()} text characters per document.`,
    );
  const candidates: Candidate[] = [];
  const add = (start: number, end: number, category: PiiCategory, method: DetectionMethod) => {
    while (start < end && /[ \t]/u.test(input[start]!)) start++;
    while (end > start && /[ \t]/u.test(input[end - 1]!)) end--;
    if (end > start) candidates.push({ start, end, category, method });
  };
  for (const [category, pattern] of labels) {
    // A fresh RegExp makes this function safe across repeated calls.
    for (const match of input.matchAll(new RegExp(pattern.source, pattern.flags))) {
      const captured = match[1]!;
      const start = match.index + match[0].length - captured.length;
      const boundary = captured.search(nextLabel);
      add(start, start + (boundary < 0 ? captured.length : boundary), category, 'labeled-field');
    }
  }
  // A name discovered in a header must also disappear from narrative text.
  // Avoid replacing short record numbers that could be medication quantities.
  const discovered = candidates.filter(
    (c) =>
      c.method === 'labeled-field' &&
      (c.category === 'patient-name' || c.category === 'mrn' || c.category === 'date-of-birth'),
  );
  for (const candidate of discovered) {
    const value = input.slice(candidate.start, candidate.end).trim();
    if (value.length < (candidate.category === 'mrn' ? 4 : 2) || value.length > 200) continue;
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escape(value)}(?![\\p{L}\\p{N}])`, 'giu');
    for (const match of input.matchAll(pattern))
      add(match.index, match.index + match[0].length, candidate.category, 'labeled-field');
  }
  const patterns: readonly [PiiCategory, RegExp][] = [
    ['ssn', /(?<!\d)\d{3}[- ]\d{2}[- ]\d{4}(?!\d)/gu],
    ['ssn', /(?<![\p{L}\p{N}])\d{9}(?![\p{L}\p{N}])/gu],
    ['email', /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}/giu],
    [
      'phone',
      /(?<![\p{L}\p{N}])(?:\+?\d{1,3}[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]?\d{3}[ .-]\d{4}(?:[ \t]*(?:ext\.?|x)[ \t]*\d{1,6})?(?!\d)/giu,
    ],
    ['phone', /(?<![\p{L}\p{N}])\+?\d{10,15}(?![\p{L}\p{N}])/gu],
    [
      'date-of-birth',
      /\b(?:born\s+(?:on\s+)?)(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Z]+\s+\d{1,2},?\s+\d{4})\b/giu,
    ],
  ];
  for (const [category, pattern] of patterns)
    for (const match of input.matchAll(pattern))
      add(match.index, match.index + match[0].length, category, 'pattern');
  for (const [category, hints] of [
    ['patient-name', options.knownPatientNames],
    ['mrn', options.knownIdentifiers],
  ] as const) {
    for (const hint of hints ?? []) {
      const value = hint.trim();
      if (value.length < 2 || value.length > 200)
        throw new PrivacyError(
          'INVALID_INPUT',
          'Identifier hints must be between 2 and 200 characters.',
        );
      const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escape(value)}(?![\\p{L}\\p{N}])`, 'giu');
      for (const match of input.matchAll(pattern))
        add(match.index, match.index + match[0].length, category, 'user-hint');
    }
  }
  const merged: {
    start: number;
    end: number;
    categories: Set<PiiCategory>;
    methods: Set<DetectionMethod>;
  }[] = [];
  for (const candidate of candidates.sort((a, b) => a.start - b.start || b.end - a.end)) {
    const previous = merged.at(-1);
    if (previous && candidate.start < previous.end) {
      previous.end = Math.max(previous.end, candidate.end);
      previous.categories.add(candidate.category);
      previous.methods.add(candidate.method);
    } else
      merged.push({
        start: candidate.start,
        end: candidate.end,
        categories: new Set([candidate.category]),
        methods: new Set([candidate.method]),
      });
  }
  const redactions: readonly Redaction[] = Object.freeze(
    merged.map((m) => {
      const categories = Object.freeze([...m.categories].sort());
      return Object.freeze({
        start: m.start,
        end: m.end,
        categories,
        methods: Object.freeze([...m.methods]),
        replacement: `[REDACTED:${categories.join('+').toUpperCase()}]`,
      });
    }),
  );
  let text = '',
    cursor = 0;
  for (const r of redactions) {
    text += input.slice(cursor, r.start) + r.replacement;
    cursor = r.end;
  }
  text += input.slice(cursor);
  const cloudBlockReasons: string[] = [];
  if (
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/u.test(
      input,
    )
  )
    cloudBlockReasons.push(
      'Invisible or directional control characters need to be removed and the text reviewed again.',
    );
  const result = Object.freeze({
    id: crypto.randomUUID(),
    text,
    redactions,
    inputCharacters: input.length,
    reviewRequired: true as const,
    warnings: Object.freeze([
      REVIEW_NOTICE,
      ...(redactions.length === 0
        ? ['No identifiers were detected. That does not mean none are present.']
        : []),
    ]),
    cloudBlockReasons: Object.freeze(cloudBlockReasons),
  }) as ScrubbedDocument;
  issued.add(result);
  return result;
}

export function assertScrubbedDocument(document: ScrubbedDocument): void {
  if (!document || !issued.has(document))
    throw new PrivacyError('INVALID_INPUT', 'Create a fresh local scrub result before analysis.');
}

/** Call only after the person has reviewed this exact preview. Never persist it. */
export function approveCloudProcessing(
  document: ScrubbedDocument,
  reviewed: boolean,
  scope: CloudPermit['scope'] = 'fallback',
): CloudPermit {
  assertScrubbedDocument(document);
  if (!reviewed)
    throw new PrivacyError(
      'REVIEW_REQUIRED',
      'Review the outgoing text and explicitly allow cloud processing.',
    );
  if (document.cloudBlockReasons.length)
    throw new PrivacyError('BLOCKED_TEXT', document.cloudBlockReasons.join(' '));
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const permit = Object.freeze({ documentId: document.id, expiresAt, scope }) as CloudPermit;
  permits.set(permit, { document, expiresAt, scope });
  return permit;
}
export function revokeCloudProcessing(permit: CloudPermit): void {
  permits.delete(permit);
}
/** An identity-bound, expiring permit prevents accidental use after an edit. */
export function assertCloudPermission(
  document: ScrubbedDocument,
  permit: CloudPermit | undefined,
  scope: CloudPermit['scope'] = 'fallback',
): void {
  assertScrubbedDocument(document);
  const approval = permit && permits.get(permit);
  if (!approval || approval.document !== document)
    throw new PrivacyError(
      'INVALID_APPROVAL',
      'Cloud permission is missing or belongs to different text.',
    );
  if (Date.now() >= approval.expiresAt) {
    permits.delete(permit!);
    throw new PrivacyError('APPROVAL_EXPIRED', 'Cloud permission expired. Review this text again.');
  }
  if (scope === 'cloud-first' && approval.scope !== 'cloud-first')
    throw new PrivacyError(
      'INVALID_APPROVAL',
      'Best quality requires fresh permission to send reviewed text to cloud AI first.',
    );
  if (document.cloudBlockReasons.length)
    throw new PrivacyError('BLOCKED_TEXT', 'This text still has blocked privacy risks.');
}
