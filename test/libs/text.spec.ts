import "mocha";
import { expect } from "chai";

import { parseText } from "../../src/libs/text";

function sChunk(from: number, to: number, content: string) {
  return { type: "static", from, to, content };
}

export function eChunk(from: number, to: number, content: string) {
  return { type: "expression", from, to, content };
}

describe("Text", () => {
  it("should work", () => {
    const text = " pre { value | formatter argument } post ";
    const parsed = parseText(text);

    expect(parsed).to.deep.include(sChunk(0, 4, " pre "));
    expect(parsed).to.deep.include(sChunk(35, 40, " post "));

    expect(parsed).to.deep.include(
      eChunk(5, 34, " value | formatter argument ")
    );
  });
});
