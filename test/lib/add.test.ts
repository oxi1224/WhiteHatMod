import { add } from "#lib";
import assert from "node:assert";
import { describe, it } from "node:test";

describe("add", () => {
  it("Should return 4 when given 2 + 2", () => {
    assert.equal(add(2, 2), 4);
  });
});
