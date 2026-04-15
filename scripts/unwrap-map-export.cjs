#!/usr/bin/env node
/**
 * Rewrite a Supabase-style map export to the JSON shape Import expects.
 * Usage: node scripts/unwrap-map-export.cjs [input.json] [output.json]
 * Default: reads ./export.json, overwrites same file if output omitted.
 */
const fs = require("fs");
const path = require("path");

const inPath = path.resolve(process.argv[2] || "export.json");
const outPath = path.resolve(process.argv[3] || inPath);

const buf = fs.readFileSync(inPath);
if (buf.length === 0) {
  console.error(`Input file is empty: ${inPath}`);
  process.exit(1);
}

const raw = JSON.parse(buf.toString("utf8"));

function unwrap(x) {
  if (Array.isArray(x) && x.length > 0 && x[0] != null && typeof x[0] === "object" && "data" in x[0]) {
    return x[0].data;
  }
  if (
    x &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    !Array.isArray(x.floorPlans) &&
    x.data &&
    typeof x.data === "object" &&
    !Array.isArray(x.data) &&
    Array.isArray(x.data.floorPlans)
  ) {
    return x.data;
  }
  return x;
}

const inner = unwrap(raw);
fs.writeFileSync(outPath, `${JSON.stringify(inner, null, 2)}\n`, "utf8");
console.log(`Wrote ${outPath} (${Object.keys(inner).join(", ")})`);
