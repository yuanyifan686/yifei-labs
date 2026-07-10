/**
 * Golden-set offline regression (no API key).
 * Usage: npm run golden
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const samples = JSON.parse(
  fs.readFileSync(path.join(root, "data", "golden-set", "samples.json"), "utf8"),
);
const db = JSON.parse(
  fs.readFileSync(path.join(root, "data", "job-database.json"), "utf8"),
);

function score(resume, job) {
  const r = resume.toLowerCase();
  const hay = [job.title, job.requirements, ...(job.keywords || []), ...(job.skillTags || [])]
    .join(" ")
    .toLowerCase();
  let s = 0;
  for (const token of r.match(/[a-z]{2,}|[\u4e00-\u9fa5]{2,}/g) || []) {
    if (hay.includes(token)) s += 1;
  }
  return s;
}

const results = [];
let pass = 0;

for (const sample of samples) {
  const ranked = [...db.jobs]
    .map((job) => ({ job, s: score(sample.resume, job) }))
    .sort((a, b) => b.s - a.s);
  const top = ranked[0]?.job;
  const title = top?.title || "";
  const hit = (sample.expectTopTitleIncludes || []).some((k) =>
    title.toLowerCase().includes(String(k).toLowerCase()),
  );
  if (hit) pass += 1;
  results.push({
    id: sample.id,
    label: sample.label,
    topTitle: title,
    score: ranked[0]?.s ?? 0,
    pass: hit,
  });
  console.log(
    `${hit ? "PASS" : "FAIL"} ${sample.id} → Top1「${title}」 score=${ranked[0]?.s ?? 0}`,
  );
}

const out = {
  ranAt: new Date().toISOString(),
  pass,
  total: samples.length,
  results,
};
fs.writeFileSync(
  path.join(root, "data", "golden-set", "last-run.json"),
  JSON.stringify(out, null, 2),
  "utf8",
);
console.log(`\nGolden set: ${pass}/${samples.length} pass → data/golden-set/last-run.json`);
process.exit(pass === samples.length ? 0 : 1);
