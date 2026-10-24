export interface NameData {
  name: string;
  age: number | null;
  ageCount: number;
  gender: 'male' | 'female' | null;
  genderProbability: number;
  genderCount: number;
  countries: { code: string; probability: number }[];
}

const COMMON_NAMES = [
  'Alex', 'Jordan', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Taylor',
  'Sam', 'Jamie', 'Drew', 'Reese', 'Blake', 'Cameron', 'Dakota', 'Peyton',
  'Skyler', 'Sage', 'Finley', 'Rowan', 'James', 'Emma', 'Olivia', 'Liam',
  'Noah', 'Sophia', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Ethan', 'Aiden',
  'Lucas', 'Mason', 'Logan', 'Elijah', 'Oliver', 'Aria', 'Ava', 'Isabella',
  'Mila', 'Ella', 'Avery', 'Scarlett', 'Luna', 'Chloe', 'Grace', 'Penelope',
  'Layla', 'Riley', 'Nora', 'Lily', 'Eleanor', 'Hazel', 'Violet', 'Aurora',
  'Savannah', 'Audrey', 'Brooklyn', 'Bella', 'Claire', 'Skylar', 'Paisley',
  'Everly', 'Anna', 'Caroline', 'Genesis', 'Emilia', 'Kennedy', 'Samantha',
  'Maya', 'Willow', 'Kinsley', 'Naomi', 'Kehlani', 'Aaliyah', 'Elena',
  'Sarah', 'Ariana', 'Allison', 'Gabriella', 'Alice', 'Madelyn', 'Cora',
  'Ruby', 'Eva', 'Serenity', 'Autumn', 'Adeline', 'Hailey', 'Gianna',
  'Valentina', 'Isla', 'Eliana', 'Quinn', 'Nevaeh', 'Ivy', 'Everleigh',
  'Lydia', 'Brynlee', 'Parker', 'Londyn', 'Saylor', 'Eden', 'Margaret',
];

export function generateRandomName(): string {
  return COMMON_NAMES[Math.floor(Math.random() * COMMON_NAMES.length)];
}

const ISO_COLORS: Record<string, string> = {
  US: '#3b82f6', GB: '#ef4444', CA: '#f59e0b', AU: '#8b5cf6',
  DE: '#f97316', FR: '#06b6d4', IT: '#10b981', ES: '#ec4899',
  IN: '#ff6b35', CN: '#e11d48', JP: '#d946ef', BR: '#22c55e',
  MX: '#84cc16', RU: '#6366f1', KR: '#a855f7', AR: '#14b8a6',
  NL: '#f97316', SE: '#0ea5e9', NO: '#ef4444', DK: '#f43f5e',
  FI: '#3b82f6', IE: '#22c55e', CH: '#dc2626', PT: '#e11d48',
  PL: '#a855f7', GR: '#2563eb', CZ: '#f59e0b', HU: '#84cc16',
  AT: '#ef4444', BE: '#f97316', BG: '#22c55e', RO: '#2563eb',
  UA: '#fbbf24', TR: '#e11d48', IL: '#3b82f6', ZA: '#a855f7',
  NG: '#10b981', EG: '#f59e0b', KE: '#ef4444', PH: '#06b6d4',
  VN: '#ec4899', TH: '#6366f1', ID: '#dc2626', MY: '#f97316',
  SG: '#ef4444', NZ: '#8b5cf6', PK: '#22c55e', BD: '#10b981',
  SA: '#84cc16', AE: '#f59e0b', QA: '#ef4444', CL: '#06b6d4',
  CO: '#f97316', PE: '#a855f7',
};

export function isoToColor(code: string): string {
  return ISO_COLORS[code] || '#6b7280';
}

export const FALLBACK_DATA: NameData = {
  name: 'Alex',
  age: 32,
  ageCount: 1665200,
  gender: 'male',
  genderProbability: 0.95,
  genderCount: 1665200,
  countries: [
    { code: 'US', probability: 0.25 },
    { code: 'GB', probability: 0.18 },
    { code: 'CA', probability: 0.12 },
    { code: 'AU', probability: 0.10 },
    { code: 'DE', probability: 0.08 },
  ],
};

export type NameFetchStatus = 'live' | 'rate-limited' | 'error';

export interface NameFetchResult {
  data: NameData;
  status: NameFetchStatus;
  /** Human-readable reason when status is not 'live' */
  reason?: string;
}

function sampleResult(status: NameFetchStatus, reason: string): NameFetchResult {
  // Show the built-in "Alex" sample under its own name, never under the name that failed
  return { data: { ...FALLBACK_DATA }, status, reason };
}

export async function fetchNameData(name: string): Promise<NameFetchResult> {
  const clean = name.trim().toLowerCase();
  if (!clean) return sampleResult('error', 'no name');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const query = encodeURIComponent(clean);

  try {
    const responses = await Promise.all([
      fetch(`https://api.agify.io?name=${query}`, { signal: controller.signal }),
      fetch(`https://api.genderize.io?name=${query}`, { signal: controller.signal }),
      fetch(`https://api.nationalize.io?name=${query}`, { signal: controller.signal }),
    ]);

    clearTimeout(timeout);

    // The free tier answers 429 {"error":"Request limit reached"} once the daily quota is used
    if (responses.some((r) => r.status === 429)) {
      return sampleResult('rate-limited', 'daily request limit reached (HTTP 429)');
    }
    const failed = responses.find((r) => !r.ok);
    if (failed) {
      return sampleResult('error', `HTTP ${failed.status}`);
    }

    const [agify, genderize, nationalize] = await Promise.all(responses.map((r) => r.json()));
    if (agify.error || genderize.error || nationalize.error) {
      return sampleResult('error', String(agify.error ?? genderize.error ?? nationalize.error));
    }

    return {
      status: 'live',
      data: {
        name: clean,
        age: agify.age ?? null,
        ageCount: agify.count ?? 0,
        gender: genderize.gender ?? null,
        genderProbability: genderize.probability ?? 0,
        genderCount: genderize.count ?? 0,
        countries: (nationalize.country ?? [])
          .sort((a: any, b: any) => b.probability - a.probability)
          .slice(0, 8)
          .map((c: any) => ({ code: c.country_id, probability: c.probability })),
      },
    };
  } catch (e) {
    clearTimeout(timeout);
    return sampleResult('error', e instanceof DOMException && e.name === 'AbortError' ? 'timed out' : 'network error');
  }
}
