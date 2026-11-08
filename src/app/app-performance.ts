import { defineToolcraftPerformance, deriveToolcraftPerformancePaths, type ToolcraftPerformanceScenario } from "@/toolcraft/runtime";

import { omenPerformanceModel } from "../omen/omen-performance-model";
import { appSchema } from "./app-schema";

export const omenPerformancePaths = deriveToolcraftPerformancePaths(appSchema, omenPerformanceModel);

export const appPerformance = defineToolcraftPerformance({
  ...omenPerformanceModel,
  scenarios: omenPerformancePaths.map(
    (path, index): ToolcraftPerformanceScenario =>
      ({
        automated: true,
        automatedTestName: "omen render plan has valid derived paths and fixtures",
        browser: true,
        browserTestName: `browser perf: toolcraft path ${path.id}`,
        coversTargets: path.targets,
        expectedObservable: "The name poster, viewport or decoded artifact reflects the exact applied operation.",
        fixture: "Compiled reachable omen workload",
        id: `omen-path-${index}`,
        interaction: path.interaction,
        pathId: path.id,
        uiSelector: '[data-testid="omen-output"]',
        ...(path.interaction === "export" ? { actionValue: "export.png", completionEvidence: "download" as const, controlLabel: "Export PNG" } : {}),
      }) as ToolcraftPerformanceScenario,
  ),
});
