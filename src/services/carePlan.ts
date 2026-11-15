export interface PlanMedicine {
  id: string;
  name: string;
  strength: string;
  dose: string;
  frequency: string;
  timing: string;
  route?: string;
  duration?: string;
  status?: string;
  quote: string;
  times: string[];
  confirmed: boolean;
}
export interface CareSnapshot {
  version: 1;
  medicines: PlanMedicine[];
  questions: string[];
  checkins: Record<string, 'taken' | 'later'>;
}
export const emptySnapshot = (): CareSnapshot => ({
  version: 1,
  medicines: [],
  questions: [],
  checkins: {},
});
export function validateSnapshot(value: unknown): CareSnapshot {
  if (!value || typeof value !== 'object') throw new Error('Invalid care snapshot.');
  const v = value as Record<string, unknown>;
  if (
    v.version !== 1 ||
    !Array.isArray(v.medicines) ||
    v.medicines.length > 60 ||
    !Array.isArray(v.questions) ||
    v.questions.length > 100 ||
    !v.checkins ||
    typeof v.checkins !== 'object' ||
    Array.isArray(v.checkins)
  )
    throw new Error('Invalid care snapshot.');
  const ids = new Set<string>();
  const medicines = v.medicines.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid medicine entry.');
    const m = item as Record<string, unknown>;
    for (const key of ['route', 'duration', 'status'])
      if (m[key] !== undefined && (typeof m[key] !== 'string' || (m[key] as string).length > 5000))
        throw new Error('Invalid source detail.');
    for (const key of ['id', 'name', 'strength', 'dose', 'frequency', 'timing', 'quote'])
      if (typeof m[key] !== 'string' || (m[key] as string).length > 5000)
        throw new Error('Invalid medicine text.');
    if (
      typeof m.id !== 'string' ||
      !m.id ||
      m.id.length > 100 ||
      m.id.includes(':') ||
      !(m.name as string).trim() ||
      ids.has(m.id as string) ||
      typeof m.confirmed !== 'boolean' ||
      !Array.isArray(m.times) ||
      m.times.length > 8 ||
      m.times.some((t) => typeof t !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))
    )
      throw new Error('Invalid medicine or time.');
    ids.add(m.id as string);
    return {
      id: m.id as string,
      name: m.name as string,
      strength: m.strength as string,
      dose: m.dose as string,
      frequency: m.frequency as string,
      timing: m.timing as string,
      route: (m.route as string | undefined) ?? '',
      duration: (m.duration as string | undefined) ?? '',
      status: (m.status as string | undefined) ?? '',
      quote: m.quote as string,
      times: [...new Set(m.times as string[])].sort(),
      confirmed: m.confirmed,
    };
  });
  const questions = v.questions.map((q) => {
    if (typeof q !== 'string' || q.length > 2000) throw new Error('Invalid question.');
    return q;
  });
  const entries = Object.entries(v.checkins);
  if (
    entries.length > 10000 ||
    entries.some(([k, s]) => k.length > 200 || (s !== 'taken' && s !== 'later'))
  )
    throw new Error('Invalid check-in history.');
  return {
    version: 1,
    medicines,
    questions,
    checkins: Object.fromEntries(entries) as CareSnapshot['checkins'],
  };
}
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export const checkinKey = (id: string, time: string, day = localDay()) => `${day}:${id}:${time}`;
export function dueEntries(snapshot: CareSnapshot, day = localDay()) {
  return snapshot.medicines
    .filter((m) => m.confirmed)
    .flatMap((m) =>
      m.times.map((time) => ({
        medicine: m,
        time,
        key: checkinKey(m.id, time, day),
        status: snapshot.checkins[checkinKey(m.id, time, day)] ?? 'pending',
      })),
    )
    .sort((a, b) => a.time.localeCompare(b.time) || a.medicine.name.localeCompare(b.medicine.name));
}
const encode = (bytes: Uint8Array) => {
  let result = '';
  for (let i = 0; i < bytes.length; i += 8192)
    result += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(result);
};
function decode(text: string) {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}
async function derive(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 250000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}
export async function encryptSnapshot(snapshot: CareSnapshot, password: string): Promise<string> {
  if (password.length < 10 || password.length > 200)
    throw new Error('Use a passphrase of 10–200 characters.');
  const data = validateSnapshot(snapshot),
    salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12)),
    key = await derive(password, salt);
  const plain = new TextEncoder().encode(JSON.stringify(data));
  if (plain.byteLength > 1000000)
    throw new Error('This care copy is too large. Remove old check-ins or split the plan.');
  const bytes = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode('MedBrige-Care-v1') },
    key,
    plain,
  );
  return JSON.stringify({
    format: 'medbrige-care',
    version: 1,
    salt: encode(salt),
    iv: encode(iv),
    data: encode(new Uint8Array(bytes)),
  });
}
export async function decryptSnapshot(text: string, password: string): Promise<CareSnapshot> {
  try {
    if (text.length > 3000000 || password.length > 200) throw new Error();
    const p = JSON.parse(text);
    if (p.format !== 'medbrige-care' || p.version !== 1 || typeof p.data !== 'string')
      throw new Error();
    const salt = decode(p.salt),
      iv = decode(p.iv);
    if (salt.length !== 16 || iv.length !== 12) throw new Error();
    const key = await derive(password, salt);
    const bytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode('MedBrige-Care-v1') },
      key,
      decode(p.data),
    );
    return validateSnapshot(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    throw new Error(
      'Could not unlock this file. Check the passphrase and file. Nothing was imported.',
    );
  }
}
export function downloadLocal(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function handoffText(snapshot: CareSnapshot): string {
  const reviewed = snapshot.medicines.filter((m) => m.confirmed);
  return [
    'MedBrige · Care conversation sheet',
    'User-reviewed notes. Not a prescription or an interaction check.',
    '',
    ...reviewed.flatMap((m) => [
      `${m.name} ${m.strength}`.trim(),
      `Source dose: ${m.dose || 'Not stated'}`,
      `Source frequency: ${m.frequency || 'Not stated'}`,
      `Source route: ${m.route || 'Not stated'}`,
      `Source duration: ${m.duration || 'Not stated'}`,
      `Source status: ${m.status || 'Not stated'}`,
      `User-entered times: ${m.times.join(', ') || 'Not set'}`,
      `Original wording: ${m.quote}`,
      '',
    ]),
    'Questions for the care team',
    ...snapshot.questions.map((q) => `• ${q}`),
  ].join('\n');
}
