import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
import { omenReadiness, omenSectionInventory } from "../omen/omen-inventory";
import { NAME_PRESETS, OMEN_TARGETS, VIEWS } from "../omen/omen-settings";

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = omenReadiness;

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = omenSectionInventory;

type Budget = "extended-io" | "standard";
const browser = (testName: string, file: `e2e/${string}.spec.ts`, budget: Budget = "standard") => ({ budget, file, testName });

const domainFile = (id: string) => `e2e/product-omen-${id.split(".")[0]}.spec.ts` as const;

const sliderRow = (id: string, target: string, label: string, observable: string, interactionId: string): ToolcraftComponentAcceptance => ({
  automated: true,
  automatedTestName: `omen control ${target}`,
  browser: browser(`browser: omen control ${target}`, domainFile(id)),
  componentType: "slider",
  evidence: "product-output",
  expectedObservable: observable,
  fixture: "Default name Emma with the bundled name data",
  id,
  interactionId,
  kind: "control",
  target,
  userAction: `Drag the ${label} slider.`,
});

const actionRow = (id: string, target: string, values: readonly string[], observable: string, interactionId: string): ToolcraftComponentAcceptance => ({
  actionCoverage: values,
  automated: true,
  automatedTestName: `omen control ${target}`,
  browser: browser(`browser: omen control ${target}`, domainFile(id)),
  componentType: "actions",
  evidence: "product-output",
  expectedObservable: observable,
  fixture: "Default name Emma with the bundled name data",
  id,
  interactionId,
  kind: "control",
  target,
  userAction: "Click every button.",
});

const runtimeRow = (id: string, target: string, evidence: ToolcraftComponentAcceptance["evidence"], testName: string, file: `e2e/${string}.spec.ts`, budget: Budget = "standard"): ToolcraftComponentAcceptance => ({
  automated: true,
  automatedTestName: `omen contract ${id}`,
  browser: browser(testName, file, budget),
  componentType: id,
  evidence,
  expectedObservable: `The real product output and runtime workspace implement ${id}.`,
  fixture: "Default settings and real Toolcraft controls",
  id,
  kind: "runtime",
  target,
  userAction: `Exercise ${id} through its visible controls.`,
});

const exportTest = "browser: omen image export delivers every format and size";

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    ...sliderRow("name.text", OMEN_TARGETS.name, "First name", "The poster shows the new name with its own figures and chart, or says it is not in the data.", "name-property"),
    componentType: "text",
    userAction: "Type a new first name.",
  },
  actionRow("name.preset", OMEN_TARGETS.preset, NAME_PRESETS.map((preset) => preset.value), "Each button fills in its name and the poster redraws for it.", "preset-command"),
  {
    ...sliderRow("chart.view", OMEN_TARGETS.view, "Show", "Living colours survivors over grey births with a median line; Births colours every birth.", "view-property"),
    componentType: "segmented",
    optionCoverage: VIEWS.map((view) => view.value),
    userAction: "Choose every Show option.",
  },
  {
    ...runtimeRow("appearance.background", OMEN_TARGETS.background, "product-output", "browser: omen background color changes output", "e2e/product-omen-appearance.spec.ts"),
    componentType: "color",
    interactionId: "background-color-property",
    kind: "control",
  },
  {
    ...runtimeRow("background.output", OMEN_TARGETS.includeBackground, "product-output", "browser: omen background output follows runtime semantics", "e2e/product-omen-background.spec.ts"),
    backgroundOutputCoverage: "all-required-background-output",
    componentType: "switch",
    interactionId: "background-include-property",
    kind: "control",
  },
  ...(["format", "resolution"] as const).map(
    (key): ToolcraftComponentAcceptance => ({
      ...runtimeRow(`export.image.${key}`, `export.image.${key}`, "exported-bytes", exportTest, "e2e/product-omen-export.spec.ts", "extended-io"),
      componentType: "select",
      kind: "control",
      optionCoverage: key === "format" ? ["png", "jpg"] : ["2k", "4k", "8k"],
    }),
  ),
  {
    ...runtimeRow("export.image", "actions.output", "exported-bytes", exportTest, "e2e/product-omen-export.spec.ts", "extended-io"),
    actionCoverage: ["export.png"],
    componentType: "panelActions",
    kind: "control",
    exportArtifactCoverage: "all-required-image-export-behavior",
  },
  {
    ...runtimeRow("export.infinity", "actions.output", "exported-bytes", exportTest, "e2e/product-omen-export.spec.ts", "extended-io"),
    infinityCanvasCoverage: "scene-bounds-image-export",
  },
  {
    ...runtimeRow("canvas.size", "canvas.size.width", "product-output", "browser: omen canvas sizing changes output", "e2e/product-omen-canvas.spec.ts"),
  },
  {
    ...runtimeRow("canvas.scale", "canvas.renderScale", "product-output", "browser: omen backing preserves selected render scale", "e2e/product-omen-canvas.spec.ts"),
    renderScaleCoverage: { kind: "selected-backing-pixels", states: ["interaction", "steady"] },
  },
  {
    ...runtimeRow("canvas.infinity", "canvas.infinity", "viewport-side-effect", "browser: omen infinity preserves scene and viewport", "e2e/product-omen-canvas.spec.ts"),
    infinityCanvasCoverage: "mode-continuity-and-restoration",
  },
  {
    automated: true,
    automatedTestName: "declares production reload coverage for the starter schema",
    browser: {
      budget: "extended-io",
      file: "e2e/product-omen-persistence.spec.ts",
      testName: "browser: omen restores poster and workspace after reload",
    },
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable: "Canvas size, zoom, the chosen name and the moved, collapsed Controls panel are restored after a real reload, and the poster matches its pre-reload pixels.",
    fixture: "Omen persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices: appSchema.persistence.storage === "localStorage" ? appSchema.persistence.include : [],
    target: "canvas.size.width",
    userAction: "Change Canvas width, pick Dorothy, zoom in, move and collapse Controls, wait for persistence, and reload the page.",
  },
];
