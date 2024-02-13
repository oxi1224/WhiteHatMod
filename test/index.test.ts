import { addTimesTwo } from "#src/index.js";
import assert from "node:assert";
import { describe, it } from "node:test";

describe("addTimesTwo", () => {
  it("should return return 8 given 2 + 2", () => {
    assert.equal(addTimesTwo(2, 2), 8);
  });
});
