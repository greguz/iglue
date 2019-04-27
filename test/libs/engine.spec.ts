import "mocha";
import { expect } from "chai";

import {
  buildExpressionGetter,
  buildExpressionSetter
} from "../../src/libs/engine";

describe("Expressions", () => {
  const formatters = {
    multiply: (a: number, b: number) => a * b,
    add: (a: number, b: number) => a + b
  };

  describe("Getters", () => {
    it("should work with primitive values", () => {
      const get = buildExpressionGetter(
        {
          formatters: [],
          target: {
            type: "primitive",
            value: 42
          },
          watch: []
        },
        formatters
      );
      expect(get()).to.be.equal(42);
    });

    it("should work with path values", () => {
      const get = buildExpressionGetter(
        {
          formatters: [],
          target: {
            type: "path",
            value: "value"
          },
          watch: []
        },
        formatters
      );
      expect(get.call({ value: 4 })).to.be.equal(4);
      expect(get.call({ value: 2 })).to.be.equal(2);
    });

    it("should work with one formatter", () => {
      const get = buildExpressionGetter(
        {
          formatters: [
            {
              name: "multiply",
              targets: [
                {
                  type: "path",
                  value: "multiply"
                }
              ]
            }
          ],
          target: {
            type: "path",
            value: "value"
          },
          watch: []
        },
        formatters
      );
      expect(get.call({ value: 2, multiply: 2 })).to.be.equal(4);
      expect(get.call({ value: 4, multiply: 2 })).to.be.equal(8);
    });

    it("should work with two formatters", () => {
      const get = buildExpressionGetter(
        {
          formatters: [
            {
              name: "multiply",
              targets: [
                {
                  type: "path",
                  value: "multiply"
                }
              ]
            },
            {
              name: "add",
              targets: [
                {
                  type: "path",
                  value: "add"
                }
              ]
            }
          ],
          target: {
            type: "path",
            value: "value"
          },
          watch: []
        },
        formatters
      );
      expect(get.call({ value: 3, multiply: 6, add: 1 })).to.be.equal(19);
      expect(get.call({ value: 2, multiply: 5, add: 3 })).to.be.equal(13);
    });

    it("should work with deep values", () => {
      const get = buildExpressionGetter(
        {
          formatters: [],
          target: {
            type: "path",
            value: "a.b.c"
          },
          watch: []
        },
        formatters
      );
      expect(get.call({ a: { b: { c: 42 } } })).to.be.equal(42);
    });
  });

  describe("Setters", () => {
    it("should work with deep values", () => {
      const set = buildExpressionSetter(
        {
          formatters: [],
          target: {
            type: "path",
            value: "a.b.c"
          },
          watch: []
        },
        formatters
      );
      const obj: any = {};
      set.call(obj, 42);
      expect(obj.a.b.c).to.be.equal(42);
    });
  });
});
