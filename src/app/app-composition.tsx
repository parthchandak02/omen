import { getToolcraftFiniteArtboardRect } from "@/toolcraft/runtime";
import { composeToolcraftApp } from "@/toolcraft/runtime/react";

import { handleOmenAction } from "../omen/omen-actions";
import { OmenCanvas } from "../omen/OmenCanvas";
import { omenExport } from "../omen/omen-export";
import { omenPipeline } from "../omen/omen-pipeline";
import { appSchema } from "./app-schema";

export const appComposition = composeToolcraftApp(appSchema, {
  actions: { onPanelAction: handleOmenAction },
  renderer: { pipelineRegistration: omenPipeline },
  scene: {
    canvasContent: <OmenCanvas />,
    rasterFrameRenderer: omenExport,
    renderDefaultCanvasMedia: false,
    sceneBoundsProvider: ({ state }) => [getToolcraftFiniteArtboardRect(state.canvas.size)],
  },
});
