import { z } from "zod";

/** Coerce "72" / 72.4 → finite number for model-flaky score fields. */
export const looseNumber = z.preprocess((v) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(/%/g, "").trim());
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number());

export const looseScore = looseNumber;

export const looseStringArray = z.preprocess((v) => {
  if (Array.isArray(v)) return v.map((x) => String(x ?? "").trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}, z.array(z.string()));
