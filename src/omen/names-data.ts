// Omen's name data: US Social Security births 1880-2017 (CC0 `babynames`), one JSON file per first letter.

import survival from "./survival.json" with { type: "json" };

export const FIRST_YEAR = 1880;
export const LAST_YEAR = 2017;
export const AS_OF = survival.asOf;
const YEARS = LAST_YEAR - FIRST_YEAR + 1;

export type Sex = "F" | "M";
/** Births per year for one name, split by sex; zero-filled 1880-2017. */
export type NameRecord = { F: number[]; M: number[]; name: string };
export type NameData = { found: boolean; record: NameRecord };

type Chunk = Record<string, Partial<Record<Sex, number[]>>>;

export function normalizeName(input: string): string {
  const letters = input.trim().replace(/[^A-Za-z]/g, "");
  return letters ? letters[0].toUpperCase() + letters.slice(1).toLowerCase() : "";
}

function expand(series: number[] | undefined): number[] {
  const out: number[] = new Array(YEARS).fill(0);
  if (!series?.length) return out;
  const start = series[0] - FIRST_YEAR;
  for (let i = 1; i < series.length; i += 1) out[start + i - 1] = series[i];
  return out;
}

export function recordFromChunk(chunk: Chunk, name: string): NameData {
  const entry = chunk[name];
  return { found: Boolean(entry), record: { F: expand(entry?.F), M: expand(entry?.M), name } };
}

export type NameStats = {
  births: number;
  femaleShare: number;
  /** Estimated living people per birth year as of AS_OF. */
  living: number[];
  livingTotal: number;
  medianAge: number | null;
  peakShare: number;
  peakYear: number | null;
  quartiles: [number, number] | null;
  total: number[];
};

/** Births, sex split, living estimate and age quartiles of living holders. */
export function nameStats(record: NameRecord, totals: { F: number[]; M: number[] } = survival): NameStats {
  const total = record.F.map((f, i) => f + record.M[i]);
  const living = record.F.map((f, i) => f * totals.F[i] + record.M[i] * totals.M[i]);
  const births = total.reduce((a, b) => a + b, 0);
  const livingTotal = living.reduce((a, b) => a + b, 0);
  const female = record.F.reduce((a, b) => a + b, 0);
  let peakYear: number | null = null;
  let peak = 0;
  total.forEach((value, i) => {
    if (value > peak) {
      peak = value;
      peakYear = FIRST_YEAR + i;
    }
  });
  const ageAt = (fraction: number): number | null => {
    if (livingTotal <= 0) return null;
    // Walk from the youngest (latest birth year) to the oldest
    let sum = 0;
    for (let i = YEARS - 1; i >= 0; i -= 1) {
      sum += living[i];
      if (sum >= livingTotal * fraction) return AS_OF - (FIRST_YEAR + i);
    }
    return AS_OF - FIRST_YEAR;
  };
  const q1 = ageAt(0.25);
  const q3 = ageAt(0.75);
  return {
    births,
    femaleShare: births ? female / births : 0.5,
    living,
    livingTotal,
    medianAge: ageAt(0.5),
    peakShare: peak,
    peakYear,
    quartiles: q1 !== null && q3 !== null ? [q1, q3] : null,
    total,
  };
}

const cache = new Map<string, Chunk>();
const pending = new Map<string, Promise<Chunk>>();

type ChunkFetcher = (letter: string) => Promise<Chunk>;

const browserFetcher: ChunkFetcher = (letter) => fetch(`${import.meta.env.BASE_URL}data/names/${letter}.json`).then((response) => (response.ok ? response.json() : {}));

export function getCachedName(name: string): NameData | null {
  const chunk = cache.get(name.slice(0, 1).toLowerCase());
  return chunk ? recordFromChunk(chunk, name) : null;
}

export function loadName(name: string, fetcher: ChunkFetcher = browserFetcher): Promise<NameData> {
  const letter = name.slice(0, 1).toLowerCase();
  if (!letter) return Promise.resolve(recordFromChunk({}, name));
  const hit = cache.get(letter);
  if (hit) return Promise.resolve(recordFromChunk(hit, name));
  let request = pending.get(letter);
  if (!request) {
    request = fetcher(letter)
      .catch(() => ({}))
      .then((chunk) => {
        cache.set(letter, chunk);
        pending.delete(letter);
        return chunk;
      });
    pending.set(letter, request);
  }
  return request.then((chunk) => recordFromChunk(chunk, name));
}

export function clearNameCache(): void {
  cache.clear();
  pending.clear();
}
