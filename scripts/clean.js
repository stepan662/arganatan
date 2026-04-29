import { rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(".");
const workspaces = ["lib", "testapp17", "testapp19"];

function remove(target) {
  const path = resolve(root, target);
  console.log(`Removing ${path}...`);
  rmSync(path, { recursive: true, force: true });
}

remove("node_modules");

for (const workspace of workspaces) {
  remove(`${workspace}/dist`);
  remove(`${workspace}/node_modules`);
}
