import "mocha";
import { expect } from "chai";

import {
  isArrayObserved,
  observeArray,
  unobserveArray
} from "../../src/context/array";

describe("Array observing", () => {
  function noop() {}

  it("should observe array changes", () => {
    const arr: any[] = [];
    let calls = 0;
    observeArray(arr, () => calls++);
    arr.push();
    arr.shift();
    arr.pop();
    arr.splice(0, 0);
    arr.sort();
    arr.unshift();
    arr.reverse();
    expect(calls).to.equal(7);
  });

  it("should unobserve array changes", () => {
    const arr: any[] = [];
    let calls = 0;
    const fn = () => calls++;
    arr.push();
    arr.push();
    observeArray(arr, fn);
    arr.push();
    arr.push();
    unobserveArray(arr, fn);
    arr.push();
    arr.push();
    expect(calls).to.be.equal(2);
  });

  it("should detect correct status", () => {
    const arr: any[] = [];
    expect(isArrayObserved(arr)).to.be.false;
    observeArray(arr, noop);
    expect(isArrayObserved(arr)).to.be.true;
    observeArray(arr, noop);
    expect(isArrayObserved(arr)).to.be.true;
    unobserveArray(arr, noop);
    expect(isArrayObserved(arr)).to.be.true;
    unobserveArray(arr, noop);
    expect(isArrayObserved(arr)).to.be.false;
  });
});
