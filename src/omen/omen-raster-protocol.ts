import type { OmenSettings } from "./omen-settings";
import type { NameData } from "./names-data";

export type OmenRasterRequest = { backingHeight: number; backingWidth: number; data: NameData; height: number; id: number; settings: OmenSettings;  width: number };
export type OmenRasterResponse = { bitmap?: ImageBitmap; error?: string; id: number };
