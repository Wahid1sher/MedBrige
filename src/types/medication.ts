export interface EvidenceField {
  readonly value: string;
  readonly quote: string;
}
export const medicationFields = [
  'name',
  'strength',
  'dose',
  'route',
  'frequency',
  'timing',
  'duration',
  'status',
] as const;
export type MedicationField = (typeof medicationFields)[number];
export type MedicationDraft = Readonly<
  { id: string; name: EvidenceField } & Record<
    Exclude<MedicationField, 'name'>,
    EvidenceField | null
  >
>;
export interface MedicationAnalysis {
  readonly documentId: string;
  readonly medications: readonly MedicationDraft[];
  readonly inferenceSource: 'on-device' | 'cloud' | 'sample';
  readonly connectivity: 'offline' | 'online-hint' | 'unknown';
  readonly elapsedMs: number;
  readonly reviewRequired: true;
  readonly interactionScreening: { readonly status: 'not-performed'; readonly explanation: string };
}
