import { expect } from "chai";
import "mocha";

import { ICollection } from "../interfaces/ICollection";
import { IContext } from "../interfaces/IContext";
import { buildContext } from "./index";

describe("IContext", function () {
  const obj: ICollection = {};
  const context: IContext = buildContext(obj);

  it("should not be the same object", function () {
    expect(obj === context).to.be.false;
  });
});
