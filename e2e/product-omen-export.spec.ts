import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftInfinityCanvasImageExportEvidence } from "./browser-infinity-canvas-evidence";
import { expectToolcraftImageExportArtifact } from "./browser-media-export-evidence";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { downloadImage, openOmen, selectValue } from "./omen-test-helpers";
import { test } from "./toolcraft-product-test";
import { readFileSync } from "node:fs";

import { nameStats, recordFromChunk } from "../src/omen/names-data";
import { omenLayout, FEMALE, MALE } from "../src/omen/omen-draw";
import { OMEN_DEFAULTS } from "../src/omen/omen-settings";

const hex = (color: string) => [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16), 255] as const;
const backgroundRgba = hex(OMEN_DEFAULTS.background);
const { pie } = omenLayout(1920, 1080);
const chunk = JSON.parse(readFileSync(`public/data/names/${OMEN_DEFAULTS.name[0].toLowerCase()}.json`, "utf8"));
const share = nameStats(recordFromChunk(chunk, OMEN_DEFAULTS.name).record).femaleShare;
// Middle of the larger pie slice, halfway out
const angle = share >= 0.5 ? -Math.PI / 2 + share * Math.PI : -Math.PI / 2 + share * 2 * Math.PI + (1 - share) * Math.PI;
const slice = { rgba: hex(share >= 0.5 ? FEMALE : MALE), xRatio: (pie.x + Math.cos(angle) * pie.r * 0.55) / 1920, yRatio: (pie.y + Math.sin(angle) * pie.r * 0.55) / 1080 };

const posterArtifact = {
  backgroundRgba,
  // Measured from a real export of the default poster for Emma
  expectedBounds: { height: 0.796875, width: 0.90625, x: 0.046875, y: 0.09375 },
  expectedPixels: [
    slice,
    { rgba: backgroundRgba, xRatio: 0.02, yRatio: 0.02 },
  ],
};

test("browser: omen image export delivers every format and size", async ({ page }) => {
  const session = await openOmen(page);
  const artifact = posterArtifact;
  for (const [format, mediaType] of [["PNG", "image/png"], ["JPG", "image/jpeg"]] as const) {
    await selectValue(page, "export.image.format", format);
    for (const [resolution, width] of [["2K", 2048], ["4K", 4096], ["8K", 8192]] as const) {
      await selectValue(page, "export.image.resolution", resolution);
      await expectToolcraftImageExportArtifact(session.targetAction("actions.output", () => downloadImage(page)), {
        ...artifact,
        additionalArtifactRequirements: [
          { requirementId: "export.image.format", target: "export.image.format" },
          { requirementId: "export.image.resolution", target: "export.image.resolution" },
        ],
        expectedHeight: (width * 9) / 16,
        expectedMediaType: mediaType,
        expectedWidth: width,
        page,
        requirementId: "export.image",
      });
    }
  }
  await selectValue(page, "export.image.format", "PNG");
  await selectValue(page, "export.image.resolution", "2K");
  await page.getByRole("switch", { exact: true, name: "Infinity canvas" }).uncheck();
  const finite = (await inspectToolcraftImageDownload({ backgroundRgba, download: await downloadImage(page), page })).inspection;
  await page.getByRole("switch", { exact: true, name: "Infinity canvas" }).check();
  const infinite = (await inspectToolcraftImageDownload({ backgroundRgba, download: await downloadImage(page), page })).inspection;
  await expectToolcraftInfinityCanvasImageExportEvidence({ finite, infinite }, { expectedSize: { height: 1152, width: 2048 }, requirementId: "export.infinity", target: "actions.output" });
  await expectToolcraftReferenceParity(async () => [infinite.width / infinite.height, infinite.decodedPixelHash === finite.decodedPixelHash], [16 / 9, true], { requirementId: "export.infinity", target: "actions.output" });
});
