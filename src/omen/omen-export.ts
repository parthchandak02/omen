import type { ToolcraftProductExportRenderer } from "@/toolcraft/runtime";

import { drawOmen } from "./omen-draw";
import { exportPass } from "./omen-pipeline";
import { readOmenSettings } from "./omen-settings";
import { loadName } from "./names-data";

export const omenExport: ToolcraftProductExportRenderer = {
  baseFileName: "omen",
  async renderFrame({ context, frame, rendererPipeline, signal, state }) {
    const settings = readOmenSettings(state.values);
    const data = await loadName(settings.name);
    const render = () => {
      signal.throwIfAborted();
      context.save();
      context.translate(frame.x, frame.y);
      drawOmen(context, frame.width, frame.height, settings, data);
      context.restore();
      signal.throwIfAborted();
    };
    if (rendererPipeline) await rendererPipeline.runPass(exportPass, undefined, render);
    else render();
  },
};
