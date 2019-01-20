import { AttributeValueInfo, Value } from "../interfaces/AttributeInfo";
import { Context } from "../interfaces/Context";
import { Formatter, FormatterFunction } from "../interfaces/Formatter";

import {
  Collection,
  isArray,
  isFunction,
  isObject,
  parsePath,
  uniq
} from "../utils";

/**
 * Simple map function
 */
type Mapper = (value: any) => any;

/**
 * Simplest type of map function
 */
function passthrough<T>(value: T): T {
  return value;
}

/**
 * Compose two map functions into a single one
 */
function composeMappers(first: Mapper, second: Mapper): Mapper {
  return function composedMapper(value: any): any {
    return second.call(this, first.call(this, value));
  };
}

/**
 * Reduce multiple mappers into a single one
 */
function reduceMappers(mappers: Mapper[]): Mapper {
  return mappers.length <= 0 ? passthrough : mappers.reduce(composeMappers);
}

/**
 * Return a function that throw an error if called
 */
function toThrow(message: string): (...args: any[]) => any {
  return function ko(): void {
    throw new Error(message);
  };
}

/**
 * Wrap const value into a function
 */
function toConst<T>(value: T) {
  return function get() {
    return value;
  };
}

/**
 * Get and normalize a formatter
 */
function getFormatter(
  formatters: Collection<Formatter | FormatterFunction>,
  name: string
): Formatter {
  const definition = formatters[name];

  if (isFunction(definition)) {
    return { pull: definition };
  } else if (isObject(definition)) {
    return definition;
  } else {
    throw new Error(`Unable to resolve formatter "${name}"`);
  }
}

/**
 * Build a getter function by object and path
 */
function buildGetter(path: string) {
  const tokens = parsePath(path);

  return function get(): any {
    let o: any = this;

    for (const token of tokens) {
      if (isObject(o)) {
        o = o[token];
      } else {
        return undefined;
      }
    }

    return o;
  };
}

/**
 * Build a setter function by object and path
 */
function buildSetter(path: string) {
  const tokens = parsePath(path);

  return function set(value: any): void {
    let o: any = this;
    let i: number;

    for (i = 0; i < tokens.length - 1; i++) {
      const token: string = tokens[i];

      if (o[token] === undefined) {
        if (/^\d+$/.test(token)) {
          o[token] = [];
        } else {
          o[token] = {};
        }
      } else if (!isObject(o[token])) {
        throw new Error("Unable to set the target object");
      }
      o = o[token];
    }

    const last = tokens[i];
    if (isArray(o) && /^\d+$/.test(last)) {
      o.splice(parseInt(last, 10), 1, value);
    } else {
      o[last] = value;
    }
  };
}

/**
 * Map a value into a getter function
 */
function buildValueGetter(value: Value) {
  return value.type === "path"
    ? buildGetter(value.value)
    : toConst(value.value);
}

/**
 * Map a value into a setter function
 */
function buildValueSetter(value: Value) {
  return value.type === "path"
    ? buildSetter(value.value)
    : toThrow("You cannot update a primitive value");
}

/**
 * Bind formatter arguments to its functions
 */
function bindFormatterArguments(
  format: FormatterFunction,
  values: Value[]
): Mapper {
  const getters = values.map(buildValueGetter);

  return function formatValue(value: any): any {
    return format.apply(this, [
      value,
      ...getters.map(getter => getter.call(this))
    ]);
  };
}

/**
 * Build a value getter by expression
 */
export function getExpressionGetter(
  formatters: Collection<Formatter | FormatterFunction>,
  expression: AttributeValueInfo
) {
  const formatter: (name: string) => Formatter = getFormatter.bind(
    null,
    formatters
  );

  const pull = reduceMappers(
    expression.formatters.map(entry =>
      bindFormatterArguments(
        formatter(entry.name).pull ||
          toThrow(`Formatter "${entry.name}" does not have pull function`),
        entry.arguments
      )
    )
  );

  const getSourceValue = buildValueGetter(expression.value);

  return function get(): any {
    return pull.call(this, getSourceValue.call(this));
  };
}

/**
 * Build a value setter by expression
 */
export function getExpressionSetter(
  formatters: Collection<Formatter | FormatterFunction>,
  expression: AttributeValueInfo
) {
  const formatter: (name: string) => Formatter = getFormatter.bind(
    null,
    formatters
  );

  const push = reduceMappers(
    expression.formatters.map(entry =>
      bindFormatterArguments(
        formatter(entry.name).push ||
          toThrow(`Formatter "${entry.name}" does not have push function`),
        entry.arguments
      )
    )
  );

  const setTargetValue = buildValueSetter(expression.value);

  return function set(value: any): void {
    setTargetValue.call(this, push.call(this, value));
  };
}

/**
 * Get all used paths by the expression
 */
function getPaths({ formatters, value, watch }: AttributeValueInfo): string[] {
  const paths: string[] = [];
  if (value.type === "path") {
    paths.push(value.value);
  }
  for (const path of watch) {
    paths.push(path);
  }
  for (const fi of formatters) {
    for (const fa of fi.arguments) {
      if (fa.type === "path") {
        paths.push(fa.value);
      }
    }
  }
  return uniq(paths);
}

/**
 * Observe expression targets
 */
export function observeExpression(
  context: Context,
  expression: AttributeValueInfo,
  callback: () => void
) {
  const paths = getPaths(expression);

  for (const path of paths) {
    context.$observe(path, callback);
  }

  return function unobserve(): void {
    for (const path of paths) {
      context.$unobserve(path, callback);
    }
  };
}
