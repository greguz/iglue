import { expect } from "chai";
import "mocha";

import { isObservedObject, observeProperty, unobserveProperty } from "./object";

function noop(): void { }

describe("Object observing", function () {
  it("should detect observing status", function () {
    const obj: any = { value: 42 };

    expect(isObservedObject(obj)).to.be.false;
    expect(isObservedObject(obj, "value")).to.be.false;

    observeProperty(obj, "value", noop);

    expect(isObservedObject(obj)).to.be.true;
    expect(isObservedObject(obj, "value")).to.be.true;
    expect(isObservedObject(obj, "other")).to.be.false;
  });

  it("should fail to override listeners container", function () {
    const obj: any = { value: 42 };
    observeProperty(obj, "value", noop);

    function overrideOL(): void {
      obj._ol_ = [];
    }
    expect(overrideOL).to.throw();
  });

  it("should not clone listeners", function () {
    const obj: any = { value: 42 };
    observeProperty(obj, "value", noop);

    const bro: any = Object.assign({}, obj);

    expect(isObservedObject(obj)).to.be.true;
    expect(isObservedObject(bro)).to.be.false;
    expect(bro._ol_).to.be.undefined;
  });

  it("should detect value changes", function () {
    const obj: any = { value: 42 };

    let expected: any;
    let count: number = 0;
    function callback() {
      count++;
      expect(obj.value).to.be.equal(expected);
    }

    observeProperty(obj, "value", callback);

    expected = 4;
    obj.value = 4;
    obj.value = 4;

    expected = 2;
    obj.value = 2;
    obj.value = 2;

    expect(count).to.be.equal(2);
  });

  it("should stop value observing", function () {
    const obj: any = { value: 42 };

    let count: number = 0;
    function callback() {
      count++;
    }

    observeProperty(obj, "value", callback);

    obj.value = 1;

    unobserveProperty(obj, "value", callback);

    obj.value = 2;
    obj.value = 3;
    obj.value = 4;
    obj.value = 5;
    obj.value = 6;

    expect(count).to.be.equal(1);
  });
});
