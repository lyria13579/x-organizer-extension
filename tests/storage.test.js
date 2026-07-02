import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAppState } from "../src/storage.js";

test("normalizeAppState defaults theme to light and accepts dark", () => {
  assert.equal(normalizeAppState({ settings: {} }).settings.theme, "light");
  assert.equal(normalizeAppState({ settings: { theme: "light" } }).settings.theme, "light");
  assert.equal(normalizeAppState({ settings: { theme: "dark" } }).settings.theme, "dark");
});
