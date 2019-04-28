import "mocha";
import { expect } from "chai";

import { parseTargets } from "../../src/libs/targets";

describe("Targets", () => {
  it("should handle undefined", () => {
    expect(parseTargets("undefined")).to.deep.include({
      type: "primitive",
      value: undefined
    });
  });

  it("should handle null", () => {
    expect(parseTargets("null")).to.deep.include({
      type: "primitive",
      value: null
    });
  });

  it("should handle booleans", () => {
    expect(parseTargets("true")).to.deep.include({
      type: "primitive",
      value: true
    });
    expect(parseTargets("false")).to.deep.include({
      type: "primitive",
      value: false
    });
  });

  it("should handle numbers", () => {
    expect(parseTargets("1")).to.deep.include({
      type: "primitive",
      value: 1
    });
    expect(parseTargets("1.1")).to.deep.include({
      type: "primitive",
      value: 1.1
    });
    expect(parseTargets("-1")).to.deep.include({
      type: "primitive",
      value: -1
    });
    expect(parseTargets("-1.3")).to.deep.include({
      type: "primitive",
      value: -1.3
    });
  });

  it("should handle strings", () => {
    expect(parseTargets("'a b c d e f g'")).to.deep.include({
      type: "primitive",
      value: "a b c d e f g"
    });
    expect(parseTargets('"a b c d e f g"')).to.deep.include({
      type: "primitive",
      value: "a b c d e f g"
    });
  });

  it("should handle paths", () => {
    expect(parseTargets("a.b.c")).to.deep.include({
      type: "path",
      value: "a.b.c"
    });
    expect(parseTargets("a[b].c")).to.deep.include({
      type: "path",
      value: "a[b].c"
    });
  });
});
