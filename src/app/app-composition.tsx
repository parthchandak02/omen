import { createRef } from "react";
import type { ToolcraftAppComposition, ToolcraftPanelActionHandler } from "@/toolcraft/runtime/react";
import { appSchema } from "./app-schema";
import { OmenCanvas } from "../components/OmenCanvas";
import { generateRandomName } from "../nameService";
import type { NameData } from "../nameService";

let triggerRef: (() => void) | null = null;
const nameDataRef = createRef<NameData | null>();

export function setTriggerRandom(fn: () => void) {
  triggerRef = fn;
}

const handlePanelAction: ToolcraftPanelActionHandler = (context) => {
  if (context.action.value === "randomName") {
    // Writing the Name field shows the new name and triggers the usual debounced lookup
    context.dispatch({
      label: "Random name",
      target: "nameInput",
      type: "controls.setValue",
      value: generateRandomName(),
    });
  }
};

export const appComposition: ToolcraftAppComposition = {
  schema: appSchema,
  canvasContent: <OmenCanvas nameDataRef={nameDataRef} />,
  onPanelAction: handlePanelAction,
  renderDefaultCanvasMedia: false,
};
