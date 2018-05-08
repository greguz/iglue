import { expect } from "chai";
import "mocha";

import { isArray, isObservedArray, observeArray, unobserveArray } from "./array";

describe("Array observing", function () {
  it("should detect array instances", function () {
    expect(isArray({})).to.be.false;
    expect(isArray([])).to.be.true;
  });

  it("should detect observing status", function () {
    const arr: any[] = [];
    expect(isObservedArray([])).to.be.false;
    observeArray(arr, () => null);
    expect(isObservedArray(arr)).to.be.true;
  });

  it("should remove observing listeners", function () {
    const arr: any[] = [];
    let count: number = 0;
    const listener = () => count++;
    observeArray(arr, listener);
    arr.push("a", "b", "c", "d");
    unobserveArray(arr, listener);
    arr.push("e", "f", "g", "h");
    expect(count).to.equal(1);
  });
});
