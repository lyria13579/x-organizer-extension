import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

assert.equal(manifest.manifest_version, 3, "manifest_version must be 3");
assert.equal(manifest.background.type, "module", "background service worker should use ES modules");
assert.ok(manifest.permissions.includes("sidePanel"), "sidePanel permission is required");
assert.ok(manifest.permissions.includes("storage"), "storage permission is required");
assert.ok(manifest.host_permissions.includes("https://x.com/*"), "x.com host permission is required");
assert.ok(manifest.side_panel.default_path, "side panel path is required");

const requiredFiles = [
  manifest.background.service_worker,
  manifest.side_panel.default_path,
  ...manifest.content_scripts.flatMap((script) => [...script.js, ...(script.css || [])]),
  "sidepanel/sidepanel.js",
  "sidepanel/sidepanel.css",
  "src/domain.js",
  "src/aiClient.js",
  "src/i18n.js",
  "src/providers.js",
  "src/storage.js",
  "src/llmPrompt.js",
  "data/sample-posts.js"
];

await Promise.all(requiredFiles.map(async (file) => {
  await access(path.join(root, file));
}));

console.log(`Validated ${requiredFiles.length} extension files.`);
