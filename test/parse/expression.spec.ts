import "mocha";
import { expect } from "chai";

import {
  getExpressionGetter,
  getExpressionSetter
} from "../../src/parse/expression";

describe("Expressions", () => {
  const formatters = {
    multiply: (a: number, b: number) => a * b,
    add: (a: number, b: number) => a + b
  };

  describe("Getters", () => {
    it("should work with primitive values", () => {
      const get = getExpressionGetter(formatters, {
        formatters: [],
        value: {
          type: "primitive",
          value: 42
        },
        watch: []
      });
      expect(get()).to.be.equal(42);
    });

    it("should work with path values", () => {
      const get = getExpressionGetter(formatters, {
        formatters: [],
        value: {
          type: "path",
          value: "value"
        },
        watch: []
      });
      expect(get.call({ value: 4 })).to.be.equal(4);
      expect(get.call({ value: 2 })).to.be.equal(2);
    });

    it("should work with one formatter", () => {
      const get = getExpressionGetter(formatters, {
        formatters: [
          {
            name: "multiply",
            arguments: [
              {
                type: "path",
                value: "multiply"
              }
            ]
          }
        ],
        value: {
          type: "path",
          value: "value"
        },
        watch: []
      });
      expect(get.call({ value: 2, multiply: 2 })).to.be.equal(4);
      expect(get.call({ value: 4, multiply: 2 })).to.be.equal(8);
    });

    it("should work with two formatters", () => {
      const get = getExpressionGetter(formatters, {
        formatters: [
          {
            name: "multiply",
            arguments: [
              {
                type: "path",
                value: "multiply"
              }
            ]
          },
          {
            name: "add",
            arguments: [
              {
                type: "path",
                value: "add"
              }
            ]
          }
        ],
        value: {
          type: "path",
          value: "value"
        },
        watch: []
      });
      expect(get.call({ value: 3, multiply: 6, add: 1 })).to.be.equal(19);
      expect(get.call({ value: 2, multiply: 5, add: 3 })).to.be.equal(13);
    });

    it("should work with deep values", () => {
      const get = getExpressionGetter(formatters, {
        formatters: [],
        value: {
          type: "path",
          value: "a.b.c"
        },
        watch: []
      });
      expect(get.call({ a: { b: { c: 42 } } })).to.be.equal(42);
    });
  });

  describe("Setters", () => {
    it("should work with deep values", () => {
      const set = getExpressionSetter(formatters, {
        formatters: [],
        value: {
          type: "path",
          value: "a.b.c"
        },
        watch: []
      });
      const obj: any = {};
      set.call(obj, 42);
      expect(obj.a.b.c).to.be.equal(42);
    });
  });
});
