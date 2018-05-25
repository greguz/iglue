import { expect } from "chai";
import "mocha";

import { ICollection } from "../interfaces/ICollection";
import { IContext } from "../interfaces/IContext";
import { buildContext } from "./index";

type Collection = ICollection<any>;

describe("IContext", function () {
  const obj: Collection = {};
  const context: IContext<Collection> = buildContext(obj);

  it("should keep the same object", function () {
    expect(obj === context).to.be.true;
  });

  it("should not notify on creation", function () {
    let count: number = 0;
    context.$observe("value", function () {
      count++;
    });
    obj.value = true;
    expect(count).to.be.equal(0);
  });
});
