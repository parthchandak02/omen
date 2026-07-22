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
    const random = generateRandomName();
    // We'll handle this via the name input control value
    // For now, dispatch a custom event that the canvas picks up
    window.dispatchEvent(new CustomEvent('omen-random-name', { detail: random }));
  }
};

export const appComposition: ToolcraftAppComposition = {
  schema: appSchema,
  canvasContent: <OmenCanvas nameDataRef={nameDataRef} />,
  onPanelAction: handlePanelAction,
  renderDefaultCanvasMedia: false,
};
