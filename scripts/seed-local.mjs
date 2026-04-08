import { mkdir, rename, writeFile } from "fs/promises";
import path from "path";

const cwd = process.cwd();
const storeDir = path.join(cwd, ".optify");
const storePath = path.join(storeDir, "dev-store.json");
const tempStorePath = path.join(storeDir, "dev-store.tmp.json");

const store = {
  users: [
    {
      id: "user_demo",
      email: "founder@optify.ai",
      fullName: "Optify Demo"
    }
  ],
  projects: [],
  experiments: [],
  events: [],
  sdkHealth: [],
  launchAudit: [],
  shopifyConnections: []
};

await mkdir(storeDir, { recursive: true });
await writeFile(tempStorePath, JSON.stringify(store, null, 2), "utf8");
await rename(tempStorePath, storePath);
console.log(`Local Optify dev store seeded at ${storePath}`);
