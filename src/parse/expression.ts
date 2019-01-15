import { AttributeValueInfo, Value } from "../interfaces/AttributeInfo";
import { Context } from "../interfaces/Context";
import { Formatter, FormatterFunction } from "../interfaces/Formatter";

import {
  isFunction,
  isObject,
  toThrow,
  parsePath,
  Collection,
  passthrough
} from "../utils";

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
function buildGetter(obj: any, path: string) {
  const tokens: string[] = parsePath(path);

  return function get(): any {
    let o: any = obj;

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
function buildSetter(obj: any, path: string) {
  const tokens: string[] = parsePath(path);

  return function set(value: any): void {
    let o: any = obj;
    let i: number;

    for (i = 0; i < tokens.length - 1; i++) {
      const token: string = tokens[i];
      if (!isObject(o[token])) {
        throw new Error("Unable to set the target object");
      }
      o = o[token];
    }

    o[tokens[i]] = value;
  };
}

/**
 * Map a value into a getter function
 */
function buildValueGetter(context: Context, value: Value) {
  if (value.type === "path") {
    return buildGetter(context, value.value);
  } else {
    return function get(): any {
      return value.value;
    };
  }
}

/**
 * Map a value into a setter function
 */
function buildValueSetter(context: Context, value: Value) {
  if (value.type === "path") {
    return buildSetter(context, value.value);
  } else {
    return toThrow("You cannot update a primitive value");
  }
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
  return paths;
}

/**
 * Bind formatter arguments to its functions
 */
function bindFormatterArguments(
  context: Context,
  fn: FormatterFunction,
  values: Value[]
): FormatterFunction {
  const getters = values.map(value => buildValueGetter(context, value));

  function args(first: any): any[] {
    const args = getters.map(getter => getter());
    args.unshift(first);
    return args;
  }

  return function x(value: any): any {
    return fn.apply(this, args(value));
  };
}

/**
 * Reduce function for transformers
 */
function reducer(acc: FormatterFunction, current: FormatterFunction) {
  return function map(value: any): any {
    return current.call(this, acc.call(this, value));
  };
}

/**
 * Build a value getter by expression
 */
export function getExpressionGetter(
  context: Context,
  formatters: Collection<Formatter | FormatterFunction>,
  expression: AttributeValueInfo
) {
  const pull = expression.formatters
    .map(entry =>
      bindFormatterArguments(
        context,
        getFormatter(formatters, entry.name).pull ||
          toThrow(`Formatter "${entry.name}" does not have pull function`),
        entry.arguments
      )
    )
    .reduce(reducer, passthrough);

  // Target value getter
  const getSourceValue = buildValueGetter(context, expression.value);

  // Compose getter and formatters
  return function get(): any {
    return pull.call(context, getSourceValue());
  };
}

/**
 * Build a value setter by expression
 */
export function getExpressionSetter(
  context: Context,
  formatters: Collection<Formatter | FormatterFunction>,
  expression: AttributeValueInfo
) {
  const push = expression.formatters
    .map(entry =>
      bindFormatterArguments(
        context,
        getFormatter(formatters, entry.name).push ||
          toThrow(`Formatter "${entry.name}" does not have push function`),
        entry.arguments
      )
    )
    .reduceRight(reducer, passthrough);

  // Target value setter
  const setTargetValue = buildValueSetter(context, expression.value);

  // Compose setter and formatters
  return function set(value: any): void {
    setTargetValue(push.call(context, value));
  };
}

/**
 * Observe expression targets
 */
export function observeExpression(
  context: Context,
  expression: AttributeValueInfo,
  callback: () => void
) {
  // Get paths to watch
  const paths = getPaths(expression);

  // Observe paths (start change reactivity)
  for (const path of paths) {
    context.$observe(path, callback);
  }

  // Stop change reactivity function
  return function unobserve(): void {
    for (const path of paths) {
      context.$unobserve(path, callback);
    }
  };
}
