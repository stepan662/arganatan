#!/usr/bin/env node
/**
 * Smoke-tests the npm package before publishing:
 *   1. Packs lib/ into pack-test/ (tarball + extracted package/)
 *   2. Verifies every file-referencing field in package.json points to a real file
 *   3. Syntax-checks all dist JS files with `node --check`
 *   4. Confirms expected exports appear in the .d.ts
 *
 * Output is left in pack-test/ for inspection (gitignored).
 */

import { execSync } from "child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const libDir = join(rootDir, "lib");
const packTestDir = join(rootDir, "pack-test");

let failures = 0;

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg) {
  console.error(`  ✗ ${msg}`);
  failures++;
}

function checkFile(label, relPath, packageDir) {
  if (existsSync(join(packageDir, relPath))) {
    pass(`${label}: ${relPath}`);
  } else {
    fail(`${label}: "${relPath}" — not found in package`);
  }
}

function walkExports(value, packageDir, path = "exports") {
  if (typeof value === "string") {
    checkFile(path, value, packageDir);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      walkExports(v, packageDir, `${path}["${k}"]`);
    }
  }
}

// Reset output dir
if (existsSync(packTestDir)) rmSync(packTestDir, { recursive: true });
mkdirSync(packTestDir);

try {
  // 1. Pack directly into pack-test/
  console.log("Packing lib/ ...");
  const raw = execSync(
    `npm pack --json --pack-destination "${packTestDir}"`,
    { cwd: libDir },
  )
    .toString()
    .trim();
  const info = JSON.parse(raw);
  const entry = Array.isArray(info) ? info[0] : info;
  const tarballPath = join(packTestDir, entry.filename);
  console.log(
    `Packed: pack-test/${entry.filename}  (${entry.entryCount} files, ${(entry.size / 1024).toFixed(1)} kB)\n`,
  );

  // 2. Extract and remove the tarball
  execSync(`tar -xzf "${tarballPath}" -C "${packTestDir}"`);
  rmSync(tarballPath);
  const packageDir = join(packTestDir, "package");

  const pkg = JSON.parse(
    readFileSync(join(packageDir, "package.json"), "utf-8"),
  );

  // 3. File references
  console.log("Checking package.json file references...");
  for (const field of ["main", "module", "browser", "types", "unpkg", "jsdelivr"]) {
    if (pkg[field]) checkFile(field, pkg[field], packageDir);
  }
  if (pkg.exports) walkExports(pkg.exports, packageDir);

  // 4. `files` entries
  console.log("\nChecking `files` entries...");
  for (const f of pkg.files ?? []) {
    if (existsSync(join(packageDir, f))) {
      pass(`"${f}" present`);
    } else {
      fail(`"${f}" — missing from package`);
    }
  }

  // 5. Syntax-check dist JS
  console.log("\nSyntax-checking dist/*.js ...");
  const distDir = join(packageDir, "dist");
  for (const file of readdirSync(distDir).filter((f) => f.endsWith(".js"))) {
    try {
      execSync(`node --check "${join(distDir, file)}"`, { stdio: "pipe" });
      pass(file);
    } catch (e) {
      fail(`${file} — ${e.stderr?.toString().trim()}`);
    }
  }

  // 6. Expected exports in .d.ts
  console.log("\nChecking .d.ts for expected exports...");
  const dts = readFileSync(join(packageDir, pkg.types), "utf-8");
  for (const name of ["createProvider", "shallow", "useStableActions"]) {
    if (dts.includes(name)) {
      pass(name);
    } else {
      fail(`"${name}" not found in ${pkg.types}`);
    }
  }
} catch (err) {
  console.error("\nFatal:", err.message);
  failures++;
}

console.log("");
if (failures > 0) {
  console.error(`Pack test FAILED (${failures} issue${failures > 1 ? "s" : ""})`);
  process.exit(1);
} else {
  console.log(`Pack test PASSED  (output in pack-test/)`);
}
