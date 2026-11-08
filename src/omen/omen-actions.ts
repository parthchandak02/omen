import type { ToolcraftCommand } from "@/toolcraft/runtime";

import { NAME_PRESETS, OMEN_TARGETS } from "./omen-settings";

type ActionContext = { action: { value: string }; dispatch: (command: ToolcraftCommand) => void };

export function handleOmenAction({ action, dispatch }: ActionContext): void {
  const preset = NAME_PRESETS.find((entry) => entry.value === action.value);
  if (!preset) return;
  dispatch({ label: preset.label, target: OMEN_TARGETS.name, type: "controls.setValue", value: preset.label });
}
