import "mocha";
import { expect } from "chai";

import { parseExpression } from "../../src/libs/expression";

describe("Expression", () => {
  it("should work", () => {
    const expression = parseExpression(
      " a.b[c] | f0 undefined false 0 '0' p0 | f1 null true 1 '1' p1 | f2 < w0 w1 w2 "
    );

    expect(expression.target).to.deep.equal({
      type: "path",
      value: "a.b[c]"
    });

    expect(expression.formatters).to.have.lengthOf(3);

    const [f0, f1, f2] = expression.formatters;

    expect(f0.name).to.equal("f0");
    expect(f0.targets).to.have.lengthOf(5);
    expect(f0.targets).to.deep.include({ type: "primitive", value: undefined });
    expect(f0.targets).to.deep.include({ type: "primitive", value: false });
    expect(f0.targets).to.deep.include({ type: "primitive", value: 0 });
    expect(f0.targets).to.deep.include({ type: "primitive", value: "0" });
    expect(f0.targets).to.deep.include({ type: "path", value: "p0" });

    expect(f1.name).to.equal("f1");
    expect(f1.targets).to.have.lengthOf(5);
    expect(f1.targets).to.deep.include({ type: "primitive", value: null });
    expect(f1.targets).to.deep.include({ type: "primitive", value: true });
    expect(f1.targets).to.deep.include({ type: "primitive", value: 1 });
    expect(f1.targets).to.deep.include({ type: "primitive", value: "1" });
    expect(f1.targets).to.deep.include({ type: "path", value: "p1" });

    expect(f2.name).to.equal("f2");
    expect(f2.targets).to.have.lengthOf(0);

    expect(expression.watch).to.include("w0");
    expect(expression.watch).to.include("w1");
    expect(expression.watch).to.include("w2");
  });
});
