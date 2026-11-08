import { registerToolcraftRendererPipeline, type ToolcraftRendererPipelinePassContract } from "@/toolcraft/runtime";

import type { OmenRasterClient } from "./omen-raster-client";
import { OMEN_TARGETS } from "./omen-settings";

const productTargets = [OMEN_TARGETS.name, OMEN_TARGETS.view, OMEN_TARGETS.background, OMEN_TARGETS.includeBackground];
const rasterInputs = [...productTargets, "canvas.size.width", "canvas.size.height", "canvas.renderScale", "canvas.zoom"];

export const omenPipeline = registerToolcraftRendererPipeline<{
  export: ToolcraftRendererPipelinePassContract<void>;
  raster: ToolcraftRendererPipelinePassContract<string | null, OmenRasterClient, readonly ["omen"]>;
}>()({
  interactionInvalidation: [
    { interaction: "initial-render", invalidates: ["raster"], targets: ["canvas"] },
    { interaction: "control-drag", invalidates: ["raster"], targets: ["canvas.renderScale"] },
    { interaction: "control-change", invalidates: ["raster"], targets: [OMEN_TARGETS.name, OMEN_TARGETS.preset, OMEN_TARGETS.view, OMEN_TARGETS.background, OMEN_TARGETS.includeBackground, "canvas.size.width", "canvas.size.height"] },
    { interaction: "control-change", invalidates: [], mustNotInvalidate: ["raster"], targets: ["canvas.infinity", "canvas.workspaceBackground", "export.image.format", "export.image.resolution"] },
    { interaction: "viewport-drag", invalidates: [], mustNotInvalidate: ["raster"], targets: ["canvas"] },
    { interaction: "viewport-zoom", invalidates: ["raster"], targets: ["canvas"] },
    { interaction: "export", invalidates: ["export"], mustNotInvalidate: ["raster"], targets: ["export.image"] },
  ],
  passes: [
    {
      cacheKey: ["request"],
      cost: { dimensions: ["width", "height", "scale", "zoom"], frequency: "interaction", relationship: "product" },
      id: "raster",
      inputs: rasterInputs,
      invalidatedBy: rasterInputs,
      kind: "rasterize",
      lifecycle: { cache: "retained-resource", resourceScope: "renderer" },
      output: "preview",
      quality: "retina",
      runsOn: "worker",
      sceneBounds: { kind: "intrinsic", reason: "Omen is a poster laid out inside its artboard; every element is positioned from the frame size, so nothing is drawn outside it." },
    },
    {
      cost: { dimensions: ["resolution"], frequency: "batch", relationship: "product" },
      id: "export",
      inputs: [...productTargets, "export.image.resolution"],
      invalidatedBy: ["export.image"],
      kind: "export",
      lifecycle: { cache: "none", resourceScope: "call" },
      output: "export",
      quality: "export",
      runsOn: "export-only",
    },
  ],
  runtimeId: "omen-name-poster-v1",
});

export const rasterPass = omenPipeline.getPass("raster");
export const exportPass = omenPipeline.getPass("export");
