import { AttributeValueInfo, Value } from "../interfaces/AttributeInfo";
import { Context } from "../interfaces/Context";
import { Formatter, FormatterFunction } from "../interfaces/Formatter";

import {
  Collection,
  isArray,
  isFunction,
  isObject,
  parsePath,
  passthrough,
  toThrow,
  uniq
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
function buildGetter(path: string) {
  const tokens = parsePath(path);

  return function get(this: any): any {
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

  return function set(this: any, value: any): void {
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
  return value.type === "path" ? buildGetter(value.value) : () => value.value;
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
): FormatterFunction {
  const getters = values.map(buildValueGetter);

  return function formatValue(this: any, value: any): any {
    return format.apply(this, [
      value,
      ...getters.map(getter => getter.call(this))
    ]);
  };
}

/**
 * Compose multiple formatter functions into a single function
 */
function composeFormatterFunctions(
  formats: FormatterFunction[]
): FormatterFunction {
  if (formats.length <= 0) {
    // No formatters specified, just return a simple passthrough function
    return passthrough;
  } else if (formats.length === 1) {
    // Simple formatter, return itself
    return formats[0];
  } else {
    // Reduce all functions into a single function
    return formats.reduce(
      (acc: FormatterFunction, current: FormatterFunction) => {
        return function format(this: any, value: any): any {
          return current.call(this, acc.call(this, value));
        };
      }
    );
  }
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

  const pull = composeFormatterFunctions(
    expression.formatters.map(entry =>
      bindFormatterArguments(
        formatter(entry.name).pull ||
          toThrow(`Formatter "${entry.name}" does not have pull function`),
        entry.arguments
      )
    )
  );

  const getSourceValue = buildValueGetter(expression.value);

  return function get(this: any): any {
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

  const push = composeFormatterFunctions(
    expression.formatters.map(entry =>
      bindFormatterArguments(
        formatter(entry.name).push ||
          toThrow(`Formatter "${entry.name}" does not have push function`),
        entry.arguments
      )
    )
  );

  const setTargetValue = buildValueSetter(expression.value);

  return function set(this: any, value: any): void {
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
