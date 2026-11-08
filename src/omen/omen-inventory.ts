import type { ToolcraftControlSectionInventoryEntry, ToolcraftProductReadiness } from "../app/acceptance/types";
import { OMEN_TARGETS } from "./omen-settings";

export const omenSectionInventory = [
  {
    entity: "Output background", entityId: "background",
    finiteSelectors: [{ reason: "Shows or hides the background fill and PNG alpha; the color stays editable either way.", role: "parameter", target: OMEN_TARGETS.includeBackground }],
    groupingReason: "One output background; runtime relocates this source pair into Settings.",
    id: "runtime.setup", targets: [OMEN_TARGETS.includeBackground, OMEN_TARGETS.background], title: "Settings",
  },
  {
    entity: "First name", entityId: "name", finiteSelectors: [],
    groupingReason: "The typed name and the name shortcuts set the one name the poster describes.",
    id: "name", targets: [OMEN_TARGETS.name, OMEN_TARGETS.preset], title: "Name",
  },
  {
    entity: "Births chart", entityId: "chart",
    finiteSelectors: [{ reason: "Chooses whether the chart shows living people or all births; every other control stays relevant.", role: "parameter", target: OMEN_TARGETS.view }],
    groupingReason: "One choice about what the chart counts.",
    id: "chart", targets: [OMEN_TARGETS.view], title: "Chart",
  },
  {
    entity: "Raster image output", entityId: "image-export",
    finiteSelectors: [
      { reason: "Selects PNG alpha support or opaque JPEG encoding.", role: "parameter", target: "export.image.format" },
      { reason: "Selects the output long-edge pixel size.", role: "parameter", target: "export.image.resolution" },
    ],
    groupingReason: "Runtime-owned image format and resolution govern one exported artifact.",
    id: "runtime.image-export", targets: ["export.image.format", "export.image.resolution"], title: "Image Export",
  },
] as const satisfies readonly ToolcraftControlSectionInventoryEntry[];

const edit = (id: string, target: string, detail: string) => ({
  alternative: { reason: "Persistent value controls on the poster would cover it.", surface: "canvas" as const },
  capability: "property-edit" as const, evidence: { detail, source: "usability-analysis" as const }, id,
  reason: "A global setting of the whole poster with no spatial handle.", selectionScope: { mode: "global" as const }, surface: "panel" as const, target,
});

export const omenReadiness: ToolcraftProductReadiness = {
  exportIntent: { image: { mode: "toolcraft-default" }, svg: { mode: "not-requested" }, video: { mode: "not-requested" } },
  interactionOwnership: [
    edit("name-property", OMEN_TARGETS.name, "The name applies to the whole poster."),
    edit("view-property", OMEN_TARGETS.view, "The chart view applies to the whole chart."),
    edit("background-color-property", OMEN_TARGETS.background, "Runtime places the background color in Settings."),
    edit("background-include-property", OMEN_TARGETS.includeBackground, "Runtime places the Background switch in Settings."),
    {
      alternative: { reason: "A shortcut command has no position on the poster.", surface: "canvas" },
      capability: "command", evidence: { detail: "Name buttons fill in the First name field.", source: "usability-analysis" },
      id: "preset-command", reason: "Shortcuts sit beside the field they fill.", surface: "panel", target: OMEN_TARGETS.preset,
    },
  ],
  mode: "product",
  productName: "Omen",
  productSummary: "A poster of what a first name says about the people who have it, from US Social Security births 1880-2017: the share of women and men, the median age and age range of living holders, the peak year, and births and survivors for every year.",
  requestedBehavior: "Rebuild Omen on the current Toolcraft with a much better design: type any first name or pick one, see who statistics expect as a clear poster, and export it as an image.",
  viewInteraction: { mode: "non-spatial", reason: "The output is a two-dimensional poster, not a three-dimensional scene." },
};
