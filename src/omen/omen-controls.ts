import type { ToolcraftControlSchema } from "@/toolcraft/runtime";

import { NAME_PRESETS, OMEN_DEFAULTS, OMEN_TARGETS, VIEWS } from "./omen-settings";

const live = {
  applicability: { mode: "always" },
  keyframeable: false,
  performanceReason: "Redraws one still poster in a worker; name data loads once per first letter and is cached.",
  performanceRole: "responsiveness",
} as const;

export const nameControls = {
  text: { ...live, defaultValue: OMEN_DEFAULTS.name, description: "Any first name; letters only.", label: "First name", target: OMEN_TARGETS.name, textValueKind: "single-line", type: "text" },
  preset: {
    actions: NAME_PRESETS.map((preset) => ({ label: preset.label, value: preset.value, variant: "outline" as const })),
    applicability: { mode: "always" },
    description: "Names with telling histories.",
    label: "Try",
    performanceReason: "Sets the name; one cached data load and redraw.",
    performanceRole: "responsiveness",
    target: OMEN_TARGETS.preset,
    type: "actions",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const chartControls = {
  view: {
    ...live,
    defaultValue: OMEN_DEFAULTS.view,
    description: "Living estimates how many are still alive today; Births shows every baby given the name.",
    label: "Show",
    options: VIEWS.map((view) => ({ label: view.label, value: view.value })),
    target: OMEN_TARGETS.view,
    type: "segmented",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const backgroundControls = {
  include: { ...live, defaultValue: true, label: "Background", target: OMEN_TARGETS.includeBackground, type: "switch" },
  color: { ...live, defaultValue: OMEN_DEFAULTS.background, label: "Background color", target: OMEN_TARGETS.background, type: "color" },
} as const satisfies Record<string, ToolcraftControlSchema>;
