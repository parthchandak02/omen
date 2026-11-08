import { normalizeName } from "./names-data";

export const OMEN_TARGETS = {
  background: "appearance.background",
  includeBackground: "export.includeBackground",
  name: "name.text",
  preset: "name.preset",
  view: "chart.view",
} as const;

export const VIEWS = [
  { label: "Living", value: "living" },
  { label: "Births", value: "births" },
] as const;
export type ChartView = (typeof VIEWS)[number]["value"];

export const OMEN_DEFAULTS = { background: "#16121C", name: "Emma", view: "living" as ChartView } as const;

export const NAME_PRESETS = [
  { label: "Emma", value: "name-emma" },
  { label: "Mary", value: "name-mary" },
  { label: "Linda", value: "name-linda" },
  { label: "Jennifer", value: "name-jennifer" },
  { label: "Dorothy", value: "name-dorothy" },
  { label: "Jayden", value: "name-jayden" },
  { label: "Taylor", value: "name-taylor" },
  { label: "Arthur", value: "name-arthur" },
] as const;

export type OmenSettings = { background: string; includeBackground: boolean; name: string; view: ChartView };

function colorValue(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof (value as { hex?: unknown }).hex === "string") return (value as { hex: string }).hex;
  return fallback;
}

export function readOmenSettings(values: Readonly<Record<string, unknown>>): OmenSettings {
  const raw = values[OMEN_TARGETS.name];
  return {
    background: colorValue(values[OMEN_TARGETS.background], OMEN_DEFAULTS.background),
    includeBackground: values[OMEN_TARGETS.includeBackground] !== false,
    name: normalizeName(typeof raw === "string" ? raw : OMEN_DEFAULTS.name),
    view: VIEWS.find((view) => view.value === values[OMEN_TARGETS.view])?.value ?? OMEN_DEFAULTS.view,
  };
}
