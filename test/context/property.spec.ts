import "mocha";
import { expect } from "chai";

import {
  isPropertyObserved,
  observeProperty,
  unobserveProperty
} from "../../src/context/property";

describe("Property observing", () => {
  function noop() {}

  it("should work", done => {
    const obj: any = {};
    observeProperty(obj, "value", value => {
      expect(value).to.be.equal(42);
      done();
    });
    obj.value = 42;
  });

  it("should fire correct times", () => {
    const obj: any = { value: 1 };
    let calls = 0;
    observeProperty(obj, "value", () => calls++);
    obj.value = 1;
    obj.value = 1;
    obj.value = 1;
    obj.value = 2;
    obj.value = 2;
    obj.value = 2;
    obj.value = 42;
    obj.value = 42;
    obj.value = 42;
    expect(calls).to.be.equal(2);
  });

  it("should not enumerate tickes var", () => {
    const obj: any = { a: 1, b: 2, c: 3 };
    observeProperty(obj, "value", noop);
    for (const key in obj) {
      expect(key).to.not.equal("_op_");
    }
  });

  it("should prevet tickets var changes", () => {
    const obj: any = {};
    observeProperty(obj, "value", noop);
    expect(() => (obj._op_ = "o_O")).to.throw(/assign/);
  });

  it("should stop property observe", () => {
    const obj: any = {};
    let calls = 0;
    const fn = () => calls++;
    observeProperty(obj, "value", fn);
    obj.value = 1;
    obj.value = 2;
    unobserveProperty(obj, "value", fn);
    obj.value = 3;
    obj.value = 4;
    expect(calls).to.be.equal(2);
  });

  it("should work with getters and setters", () => {
    const obj: any = {};
    let value: any;
    Object.defineProperty(obj, "value", {
      configurable: true,
      enumerable: true,
      get() {
        return value;
      },
      set(x: number) {
        value = x / 2;
      }
    });
    observeProperty(obj, "value", x => {
      expect(x).to.be.equal(value);
      expect(x).to.be.equal(1);
    });
    obj.value = 2;
  });

  it("should detect correct status", () => {
    const obj: any = {};
    expect(isPropertyObserved(obj, "value")).to.be.false;
    observeProperty(obj, "value", noop);
    expect(isPropertyObserved(obj, "value")).to.be.true;
    observeProperty(obj, "value", noop);
    expect(isPropertyObserved(obj, "value")).to.be.true;
    unobserveProperty(obj, "value", noop);
    expect(isPropertyObserved(obj, "value")).to.be.true;
    unobserveProperty(obj, "value", noop);
    expect(isPropertyObserved(obj, "value")).to.be.false;
  });

  it("should throw with non-objects", () => {
    expect(() => observeProperty(undefined, "value", noop)).to.throw;
    expect(() => observeProperty(null, "value", noop)).to.throw;
    expect(() => observeProperty(1, "value", noop)).to.throw;
    expect(() => observeProperty("", "value", noop)).to.throw;
    expect(() => observeProperty(true, "value", noop)).to.throw;
  });

  it("should return true when the notifier is removed", () => {
    const obj: any = {};
    observeProperty(obj, "value", noop);
    expect(unobserveProperty(obj, "value", noop.bind(null))).to.be.false;
    expect(unobserveProperty(obj, "value", noop)).to.be.true;
  });
});
