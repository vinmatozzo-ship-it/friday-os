const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveBrainPath } = require("../src/lib/brain-path");

test("defaults to the configured Brain root and permits descendants", () => {
  assert.equal(resolveBrainPath(undefined, "PVG-Brain"), "PVG-Brain");
  assert.equal(resolveBrainPath("PVG-Brain/Marketing", "PVG-Brain"), "PVG-Brain/Marketing");
  assert.equal(resolveBrainPath("Team/PVG-Brain/Plans", "Team/PVG-Brain"), "Team/PVG-Brain/Plans");
});

test("denies other drive locations and path traversal", () => {
  for (const path of [
    "Other", "PVG-Brain-Archive", "PVG-Brain/../Private", "PVG-Brain//Private",
    "/PVG-Brain", "PVG-Brain/", "PVG-Brain/%2e%2e/Private", "PVG-Brain\\Private",
    "PVG-Brain:Private", "PVG-Brain/?expand=children"
  ]) {
    assert.throws(() => resolveBrainPath(path, "PVG-Brain"), path);
  }
});
