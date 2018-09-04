import { expect } from "chai";
import "mocha";

import { Context } from "../interfaces/Context";
import { buildContext } from "./context";

describe("Context", function () {
  const obj: any = {};
  const context: Context = buildContext(obj);

  it("should not be the same object", function () {
    expect(obj === context).to.be.false;
  });
});
