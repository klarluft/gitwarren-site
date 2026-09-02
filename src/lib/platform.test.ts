import assert from "node:assert/strict";
import test from "node:test";
import { chooseBuild, readArchFromRenderer, readOs } from "./platform.ts";

test("readOs recognises what browsers actually report", () => {
  // navigator.userAgentData.platform
  assert.equal(readOs("macOS"), "mac");
  assert.equal(readOs("Windows"), "win");
  assert.equal(readOs("Linux"), "linux");

  // navigator.platform
  assert.equal(readOs("MacIntel"), "mac");
  assert.equal(readOs("Win32"), "win");
  assert.equal(readOs("Linux x86_64"), "linux");

  // raw user-agent strings
  assert.equal(readOs("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"), "mac");
  assert.equal(readOs("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "win");
  assert.equal(readOs("Mozilla/5.0 (X11; Ubuntu; Linux x86_64)"), "linux");

  assert.equal(readOs(""), null);
  assert.equal(readOs("PlayStation 5"), null);
});

test("an Apple silicon Mac lying about being Intel still gets the arm build", () => {
  // navigator.platform is "MacIntel" on Apple silicon too — deliberately.
  // Only the architecture signal may override the default.
  assert.equal(chooseBuild(readOs("MacIntel"), null), "macosArm");
});

test("chooseBuild covers every os and architecture pair", () => {
  assert.equal(chooseBuild("mac", "arm"), "macosArm");
  assert.equal(chooseBuild("mac", "x86"), "macosIntel");
  assert.equal(chooseBuild("mac", null), "macosArm");

  // Windows ships a universal installer, so architecture is irrelevant.
  assert.equal(chooseBuild("win", "arm"), "windows");
  assert.equal(chooseBuild("win", "x86"), "windows");
  assert.equal(chooseBuild("win", null), "windows");

  assert.equal(chooseBuild("linux", "arm"), "linuxArm");
  assert.equal(chooseBuild("linux", "x86"), "linux");
  assert.equal(chooseBuild("linux", null), "linux");

  // Unknown OS changes nothing at all.
  assert.equal(chooseBuild(null, "arm"), null);
  assert.equal(chooseBuild(null, null), null);
});

test("readArchFromRenderer reads real WebGL renderer strings", () => {
  assert.equal(readArchFromRenderer("Apple GPU"), "arm");
  assert.equal(readArchFromRenderer("Apple M2 Pro"), "arm");
  assert.equal(readArchFromRenderer("ANGLE (Apple, Apple M1, OpenGL 4.1)"), "arm");

  assert.equal(readArchFromRenderer("Intel Iris Pro OpenGL Engine"), "x86");
  assert.equal(readArchFromRenderer("AMD Radeon Pro 5500M OpenGL Engine"), "x86");

  // Unrecognised means unknown, never a guess.
  assert.equal(readArchFromRenderer(""), null);
  assert.equal(readArchFromRenderer("Swiftshader"), null);
});
