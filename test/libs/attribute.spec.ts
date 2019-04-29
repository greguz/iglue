import "mocha";
import { expect } from "chai";

import {
  parseArgument,
  parseDirective,
  parseModifiers
} from "../../src/libs/attribute";

describe("Attribute", () => {
  it("should parse argument", () => {
    expect(parseArgument("i-directive")).to.equal(undefined);
    expect(parseArgument("i-directive:")).to.equal(undefined);
    expect(parseArgument("i-directive:argument")).to.equal("argument");
    expect(parseArgument("i-directive:argument.modifier")).to.equal("argument");
  });

  it("should parse directive", () => {
    expect(parseDirective("i")).to.equal(undefined);
    expect(parseDirective("i-")).to.equal(undefined);
    expect(parseDirective("i-directive")).to.equal("directive");
    expect(parseDirective("i-directive:argument")).to.equal("directive");
    expect(parseDirective("i-directive.modifier")).to.equal("directive");
    expect(parseDirective("i-directive:argument.modifier")).to.equal(
      "directive"
    );
  });

  it("should parse modifiers", () => {
    expect(parseModifiers("i-directive.a.b.c.d")).to.deep.equal([
      "a",
      "b",
      "c",
      "d"
    ]);
  });
});
