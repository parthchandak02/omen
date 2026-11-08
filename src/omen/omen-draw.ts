// Draws one Omen frame in scene coordinates. The runtime paints the Background; this is foreground.

import { AS_OF, FIRST_YEAR, LAST_YEAR, nameStats, type NameData, type NameStats } from "./names-data";
import type { OmenSettings } from "./omen-settings";

const DISPLAY = "'Bodoni 72', Didot, 'Iowan Old Style', Georgia, serif";
const SANS = "'Avenir Next', 'Helvetica Neue', Arial, sans-serif";
export const FEMALE = "#F27A6B";
export const MALE = "#6FA8F5";

function rgb(hex: string): [number, number, number] {
  const v = /^#?([0-9a-f]{6})$/i.exec(hex.trim())?.[1] ?? "000000";
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function omenInk(settings: Pick<OmenSettings, "background" | "includeBackground">): string {
  const [r, g, b] = rgb(settings.background);
  return settings.includeBackground && (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55 ? "#1A1420" : "#F3ECE2";
}

/** Whole percent, with <1% and >99% for slivers so neither side reads as none. */
export function percent(share: number): string {
  if (share > 0 && share < 0.005) return "<1%";
  if (share < 1 && share > 0.995) return ">99%";
  return `${Math.round(share * 100)}%`;
}

const thousands = (value: number) => Math.round(value).toLocaleString("en-US");

/** Rounded to a readable count: 617,000 rather than 617,236. */
export function roughCount(value: number): string {
  if (value < 1000) return thousands(value);
  const digits = Math.floor(Math.log10(value));
  const unit = 10 ** Math.max(0, digits - 2);
  return thousands(Math.round(value / unit) * unit);
}

/** Scene-unit layout shared with tests. */
export function omenLayout(width: number, height: number) {
  const u = Math.min(width / 1920, height / 1080);
  const offsetX = (width - 1920 * u) / 2;
  const offsetY = (height - 1080 * u) / 2;
  const left = offsetX + 96 * u;
  const pie = { r: 104 * u, x: offsetX + 1720 * u, y: offsetY + 238 * u };
  const chart = { height: 280 * u, width: 1728 * u, x: left, y: offsetY + 646 * u };
  return { chart, left, offsetY, pie, u };
}

type Frame = { data: NameData; ink: string; layout: ReturnType<typeof omenLayout>; muted: string; settings: OmenSettings; stats: NameStats };

function tracked(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, x: number, y: number, spacing: number): void {
  let cursor = x;
  for (const char of text) {
    context.fillText(char, cursor, y);
    cursor += context.measureText(char).width + spacing;
  }
}

function drawTitle(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: Frame): void {
  const { ink, muted, settings } = frame;
  const { left, offsetY, u } = frame.layout;
  context.fillStyle = muted;
  context.font = `600 ${17 * u}px ${SANS}`;
  tracked(context, "OMEN · WHAT A FIRST NAME SAYS", left, offsetY + 118 * u, 3.6 * u);
  const name = settings.name || "—";
  let size = 230;
  context.font = `italic ${size * u}px ${DISPLAY}`;
  while (context.measureText(name).width > 1360 * u && size > 80) {
    size -= 10;
    context.font = `italic ${size * u}px ${DISPLAY}`;
  }
  context.fillStyle = ink;
  context.fillText(name, left - 8 * u, offsetY + 330 * u);
}

function drawPie(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: Frame): void {
  const { data, muted, stats } = frame;
  const { pie, u } = frame.layout;
  if (!data.found) return;
  const split = -Math.PI / 2 + stats.femaleShare * Math.PI * 2;
  context.fillStyle = FEMALE;
  context.beginPath();
  context.moveTo(pie.x, pie.y);
  context.arc(pie.x, pie.y, pie.r, -Math.PI / 2, split);
  context.closePath();
  context.fill();
  context.fillStyle = MALE;
  context.beginPath();
  context.moveTo(pie.x, pie.y);
  context.arc(pie.x, pie.y, pie.r, split, Math.PI * 1.5);
  context.closePath();
  context.fill();
  context.fillStyle = muted;
  context.font = `${17 * u}px ${SANS}`;
  context.textAlign = "center";
  context.fillText(`${percent(stats.femaleShare)} women · ${percent(1 - stats.femaleShare)} men`, pie.x, pie.y + pie.r + 34 * u);
  context.textAlign = "left";
}

function drawFigures(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: Frame): void {
  const { data, ink, muted, settings, stats } = frame;
  const { left, offsetY, u } = frame.layout;
  const plural = `${settings.name}${/s$/i.test(settings.name) ? "es" : "s"}`;
  if (!data.found) {
    context.fillStyle = ink;
    context.font = `300 ${34 * u}px ${SANS}`;
    context.fillText("Not among the 10,570 US first names given to at least", left, offsetY + 452 * u);
    context.fillText(`1,000 babies between ${FIRST_YEAR} and ${LAST_YEAR}, so there is no estimate.`, left, offsetY + 496 * u);
    return;
  }
  const figures: [string, string][] = [
    [stats.medianAge === null ? "—" : String(stats.medianAge), `median age of a living ${settings.name}`],
    [stats.quartiles ? `${stats.quartiles[0]}–${stats.quartiles[1]}` : "—", `ages of the middle half of living ${plural}`],
    [stats.peakYear === null ? "—" : String(stats.peakYear), `peak year, ${roughCount(stats.peakShare)} born`],
    [roughCount(stats.livingTotal), `estimated alive in ${AS_OF}, of ${roughCount(stats.births)} born`],
  ];
  figures.forEach(([value, caption], i) => {
    const x = left + i * 440 * u;
    context.fillStyle = ink;
    context.font = `300 ${78 * u}px ${SANS}`;
    context.fillText(value, x - 3 * u, offsetY + 470 * u);
    context.fillStyle = muted;
    context.font = `${18 * u}px ${SANS}`;
    context.fillText(caption, x, offsetY + 506 * u);
  });
}

function drawBars(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: Frame): void {
  const { data, ink, settings, stats } = frame;
  const { chart, u } = frame.layout;
  const years = stats.total.length;
  const slot = chart.width / years;
  const max = Math.max(1, ...stats.total);
  const scale = (value: number) => (value / max) * chart.height;
  const bottom = chart.y + chart.height;
  if (settings.view === "living" && stats.quartiles) {
    // Shade the birth years of the middle half of living holders
    const from = AS_OF - stats.quartiles[1] - FIRST_YEAR;
    const to = AS_OF - stats.quartiles[0] - FIRST_YEAR;
    context.fillStyle = withAlpha(ink, 0.07);
    context.fillRect(chart.x + from * slot, chart.y, (to - from + 1) * slot, chart.height);
  }
  for (let i = 0; i < years; i += 1) {
    const x = chart.x + i * slot + slot * 0.12;
    const w = slot * 0.76;
    const female = data.record.F[i];
    const male = data.record.M[i];
    if (settings.view === "living") {
      context.fillStyle = withAlpha(ink, 0.13);
      context.fillRect(x, bottom - scale(stats.total[i]), w, scale(stats.total[i]));
      const share = stats.total[i] ? stats.living[i] / stats.total[i] : 0;
      const hf = scale(female * share);
      const hm = scale(male * share);
      context.fillStyle = FEMALE;
      context.fillRect(x, bottom - hf, w, hf);
      context.fillStyle = MALE;
      context.fillRect(x, bottom - hf - hm, w, hm);
    } else {
      context.fillStyle = FEMALE;
      context.fillRect(x, bottom - scale(female), w, scale(female));
      context.fillStyle = MALE;
      context.fillRect(x, bottom - scale(female) - scale(male), w, scale(male));
    }
  }
  context.fillStyle = withAlpha(ink, 0.35);
  context.fillRect(chart.x, bottom, chart.width, 1 * u);
}

function drawAxis(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: Frame): void {
  const { ink, muted, settings, stats } = frame;
  const { chart, left, offsetY, u } = frame.layout;
  const slot = chart.width / stats.total.length;
  const bottom = chart.y + chart.height;
  context.fillStyle = muted;
  context.font = `${15 * u}px ${SANS}`;
  for (let year = 1880; year <= 2017; year += 20) {
    context.fillText(String(year), chart.x + (year - FIRST_YEAR) * slot, bottom + 24 * u);
  }
  if (settings.view === "living" && stats.medianAge !== null) {
    const x = chart.x + (AS_OF - stats.medianAge - FIRST_YEAR + 0.5) * slot;
    context.fillStyle = ink;
    context.fillRect(x - 1 * u, chart.y - 12 * u, 2 * u, chart.height + 12 * u);
    context.font = `600 ${15 * u}px ${SANS}`;
    const label = `median living ${settings.name}, born ${AS_OF - stats.medianAge}`;
    const flip = x + 8 * u + context.measureText(label).width > chart.x + chart.width;
    context.textAlign = flip ? "right" : "left";
    context.fillText(label, x + (flip ? -8 : 8) * u, chart.y - 2 * u);
    context.textAlign = "left";
  }
  context.font = `600 ${14 * u}px ${SANS}`;
  context.fillStyle = muted;
  tracked(context, settings.view === "living" ? "BORN EACH YEAR · STILL ALIVE (COLOUR)" : "BORN EACH YEAR, WOMEN AND MEN", chart.x, chart.y - 40 * u, 2.4 * u);
  context.fillStyle = withAlpha(ink, 0.42);
  context.font = `${14 * u}px ${SANS}`;
  context.fillText(
    `US Social Security card applications ${FIRST_YEAR}–${LAST_YEAR} (CC0 babynames). Survival from SSA cohort life tables, estimated for ${AS_OF}; babies born after ${LAST_YEAR} are not counted.`,
    left,
    offsetY + 994 * u,
  );
}

export function drawOmen(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, width: number, height: number, settings: OmenSettings, data: NameData): void {
  const ink = omenInk(settings);
  const frame: Frame = { data, ink, layout: omenLayout(width, height), muted: withAlpha(ink, 0.6), settings, stats: nameStats(data.record) };
  context.save();
  context.textBaseline = "alphabetic";
  context.textAlign = "left";
  drawTitle(context, frame);
  drawPie(context, frame);
  drawFigures(context, frame);
  drawBars(context, frame);
  drawAxis(context, frame);
  context.restore();
}
