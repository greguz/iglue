import { expect } from "chai";
import "mocha";

import { isObservedObject, observeProperty, unobserveProperty } from "./object";

function noop() { }

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

    let expected: any;
    let count: number = 0;
    function callback() {
      count++;
      expect(obj.value).to.be.equal(expected);
    }

    observeProperty(obj, "value", callback);

    obj.value = 3;
    obj.value = 3;

    expected = 4;
    obj.value = 4;
    obj.value = 4;

    expected = null;
    obj.value = null;

    expected = undefined;
    obj.value = undefined;

    expect(count).to.be.equal(3);

    unobserveProperty(obj, "value", callback);

    obj.value = 42;

    expect(count).to.be.equal(3);
  });

});
