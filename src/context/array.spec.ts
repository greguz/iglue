import { expect } from "chai";
import "mocha";

import { isObservedArray, observeArray, unobserveArray } from "./array";

function noop(): void {}

describe("Array observing", function() {
  it("should detect observing status", function() {
    const arr: any[] = [];
    expect(isObservedArray([])).to.be.false;
    observeArray(arr, noop);
    expect(isObservedArray(arr)).to.be.true;
  });

  it("should remove observing listeners", function() {
    const arr: any[] = [];
    expect(isObservedArray(arr)).to.be.false;
    let count: number = 0;
    const listener = () => count++;
    observeArray(arr, listener);
    arr.push("a", "b", "c", "d");
    unobserveArray(arr, listener);
    arr.push("e", "f", "g", "h");
    expect(count).to.equal(1);
    expect(isObservedArray(arr)).to.be.false;
  });
});
