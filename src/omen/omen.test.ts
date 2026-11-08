import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import { assessToolcraftRenderPlan, compileToolcraftPerformanceFixturePlan } from "@/toolcraft/runtime";

import { omenPerformancePaths, appPerformance } from "../app/app-performance";
import { appSchema } from "../app/app-schema";
import { clearNameCache, loadName, nameStats, normalizeName, recordFromChunk, type NameData } from "./names-data";
import { handleOmenAction } from "./omen-actions";
import { drawOmen, FEMALE, omenInk, percent, roughCount } from "./omen-draw";
import { omenExport } from "./omen-export";
import { omenPerformanceModel } from "./omen-performance-model";
import { omenPipeline } from "./omen-pipeline";
import { NAME_PRESETS, OMEN_TARGETS, readOmenSettings, VIEWS } from "./omen-settings";

type Call = unknown[];

function recordingContext(calls: Call[]): CanvasRenderingContext2D {
  let font = "10px sans-serif";
  return new Proxy({}, {
    get: (_target, key) => {
      if (key === "font") return font;
      if (key === "measureText") return (text: string) => ({ width: text.length * parseFloat(/(\d+(\.\d+)?)px/.exec(font)?.[1] ?? "10") * 0.55 });
      return (...args: unknown[]) => calls.push([key, ...args]);
    },
    set: (_target, key, value) => {
      if (key === "font") font = value;
      calls.push([key, value]);
      return true;
    },
  }) as CanvasRenderingContext2D;
}

const chunk = (letter: string) => JSON.parse(readFileSync(`public/data/names/${letter}.json`, "utf8"));
const dataFor = (name: string): NameData => recordFromChunk(name ? chunk(name[0].toLowerCase()) : {}, name);

function draw(values: Record<string, unknown> = {}, width = 1920, height = 1080): Call[] {
  const calls: Call[] = [];
  const settings = readOmenSettings(values);
  drawOmen(recordingContext(calls), width, height, settings, dataFor(settings.name));
  return calls;
}
const signature = (calls: Call[]) => createHash("sha256").update(JSON.stringify(calls)).digest("hex");
const texts = (calls: Call[]) => calls.filter((call) => call[0] === "fillText").map((call) => String(call[1]));
const DEFAULT = signature(draw());

describe("name data", () => {
  it("normalises typed names", () => {
    expect(normalizeName("  eMMa ")).toBe("Emma");
    expect(normalizeName("Mary-Jo")).toBe("Maryjo");
    expect(normalizeName("42")).toBe("");
  });

  it("reads the bundled Social Security counts", () => {
    const emma = dataFor("Emma");
    expect(emma.found).toBe(true);
    expect(emma.record.F[0]).toBe(2003);
    expect(emma.record.F).toHaveLength(138);
    expect(dataFor("Zzxq").found).toBe(false);
  });

  it("finds the women and the ages history implies", () => {
    const linda = nameStats(dataFor("Linda").record);
    expect(linda.femaleShare).toBeGreaterThan(0.99);
    expect(linda.peakYear).toBe(1947);
    expect(linda.medianAge).toBeGreaterThan(65);
    const jayden = nameStats(dataFor("Jayden").record);
    expect(jayden.femaleShare).toBeLessThan(0.1);
    expect(jayden.medianAge).toBeLessThan(25);
    expect(linda.livingTotal).toBeLessThan(linda.births);
  });

  it("loads one chunk per letter and caches it", async () => {
    clearNameCache();
    const fetcher = vi.fn(async (letter: string) => chunk(letter));
    await loadName("Emma", fetcher);
    await loadName("Ethan", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("explains a name that is not in the data", () => {
    expect(texts(draw({ [OMEN_TARGETS.name]: "Zzxq" })).join(" ")).toContain("so there is no estimate");
    expect(roughCount(617236)).toBe("617,000");
    expect(percent(0.001)).toBe("<1%");
    expect(percent(0.999)).toBe(">99%");
  });
});

describe("Omen controls", () => {
  it("omen control name.text", () => {
    expect(signature(draw({ [OMEN_TARGETS.name]: "Dorothy" }))).not.toBe(DEFAULT);
    expect(texts(draw({ [OMEN_TARGETS.name]: "dorothy" }))).toContain("Dorothy");
  });

  it("omen control name.preset", () => {
    for (const preset of NAME_PRESETS) {
      const dispatch = vi.fn();
      handleOmenAction({ action: { value: preset.value }, dispatch });
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ target: OMEN_TARGETS.name, value: preset.label }));
      expect(dataFor(preset.label).found).toBe(true);
    }
  });

  it("omen control chart.view", () => {
    expect(new Set(VIEWS.map((view) => signature(draw({ [OMEN_TARGETS.view]: view.value })))).size).toBe(VIEWS.length);
  });
});

describe("Omen contracts", () => {
  it("omen contract appearance.background", () => {
    expect(omenInk({ background: "#16121C", includeBackground: true })).toBe("#F3ECE2");
    expect(omenInk({ background: "#F4F1EA", includeBackground: true })).toBe("#1A1420");
    expect(signature(draw({ [OMEN_TARGETS.background]: "#F4F1EA" }))).not.toBe(DEFAULT);
  });

  it("omen contract background.output", () => {
    const fullFills = (calls: Call[]) => calls.filter((call) => call[0] === "fillRect" && call[3] === 1920 && call[4] === 1080);
    expect(fullFills(draw())).toHaveLength(0);
    expect(fullFills(draw({ [OMEN_TARGETS.includeBackground]: false }))).toHaveLength(0);
  });

  it("omen contract export.image.format", () => {
    const control = appSchema.panels.controls?.sections.flatMap((section) => Object.values(section.controls)).find((entry) => entry.target === "export.image.format");
    expect(control?.options?.map((option) => option.value)).toEqual(["png", "jpg"]);
  });

  it("omen contract export.image.resolution", () => {
    const control = appSchema.panels.controls?.sections.flatMap((section) => Object.values(section.controls)).find((entry) => entry.target === "export.image.resolution");
    expect(control?.options?.map((option) => option.value)).toEqual(["2k", "4k", "8k"]);
  });

  it("omen contract export.image", async () => {
    clearNameCache();
    vi.stubGlobal("fetch", async (url: string) => ({ json: async () => chunk(String(url).split("/").pop()!.slice(0, 1)), ok: true }));
    const calls: Call[] = [];
    await omenExport.renderFrame({ context: recordingContext(calls), frame: { height: 1080, width: 1920, x: -960, y: -540 }, signal: new AbortController().signal, state: { values: {} } } as unknown as Parameters<typeof omenExport.renderFrame>[0]);
    vi.unstubAllGlobals();
    expect(calls[1]).toEqual(["translate", -960, -540]);
    expect(texts(calls)).toContain("Emma");
    expect(calls.some((call) => call[0] === "fillStyle" && call[1] === FEMALE)).toBe(true);
  });

  it("omen contract export.infinity", () => {
    expect(omenPipeline.passes.find((pass) => pass.id === "raster")?.sceneBounds?.kind).toBe("intrinsic");
  });

  it("omen contract canvas.size", () => {
    expect(signature(draw({}, 960, 540))).not.toBe(DEFAULT);
  });

  it("omen contract canvas.scale", () => {
    const raster = omenPipeline.passes.find((pass) => pass.id === "raster");
    expect(raster?.invalidatedBy).toContain("canvas.renderScale");
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
  });

  it("omen contract canvas.infinity", () => {
    expect(omenPipeline.interactionInvalidation.find((entry) => entry.targets.includes("canvas.infinity"))?.invalidates).toEqual([]);
  });

  it("omen render plan has valid derived paths and fixtures", () => {
    expect(assessToolcraftRenderPlan(appSchema, omenPerformanceModel).errors ?? []).toEqual([]);
    expect(omenPerformancePaths.length).toBe(appPerformance.scenarios.length);
    for (const path of omenPerformancePaths) {
      if (path.workloadDimensions.length) expect(() => compileToolcraftPerformanceFixturePlan(omenPerformanceModel, path)).not.toThrow();
    }
  });
});
