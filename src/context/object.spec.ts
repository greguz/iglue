import { expect } from "chai";
import "mocha";

import { isObservedObject, observeProperty, unobserveProperty, PropertyListener } from "./object";

interface IUtil {
  count: number;
  history: any[];
  listener: PropertyListener;
}

function makeUtil(): IUtil {
  const history: any[] = [];

  let count: number = 0;

  function listener(value: any): void {
    history.push(value);
    count++;
  }

  const util: IUtil = {
    count,
    history,
    listener
  };

  Object.defineProperty(util, "count", {
    configurable: false,
    enumerable: true,
    get() {
      return count;
    }
  });

  return util;
}

function noop(): void { }

describe("Object observing", function () {

  it("status", function () {
    const obj = { value: 5 };

    // test clean status
    expect(isObservedObject(obj)).to.be.false;
    expect(isObservedObject(obj, "value")).to.be.false;

    // start observing
    observeProperty(obj, "value", noop);

    // ensure no value mutation
    expect(obj.value).to.be.equal(5);

    // test active observer
    expect(isObservedObject(obj)).to.be.true;
    expect(isObservedObject(obj, "value")).to.be.true;
    expect(isObservedObject(obj, "other")).to.be.false;

    // test value update
    obj.value = 15;
    expect(obj.value).to.be.equal(15);
  });

  it("assign", function () {
    const obj = { value: 3 };
    const util = makeUtil();

    observeProperty(obj, "value", util.listener);

    obj.value = 3;
    obj.value = 3;
    obj.value = 4;
    obj.value = 4;
    obj.value = null;
    obj.value = undefined;

    expect(util.count).to.be.equal(3);

    expect(util.history[0]).to.be.equal(4);
    expect(util.history[1]).to.be.null;
    expect(util.history[2]).to.be.undefined;

    unobserveProperty(obj, "value", util.listener);

    obj.value = 42;

    expect(util.count).to.be.equal(3);
  });

});
