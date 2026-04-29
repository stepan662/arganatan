import { rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(".");
const targets = ["lib/dist", "testapp/dist"];

for (const target of targets) {
  rmSync(resolve(root, target), { recursive: true, force: true });
}
