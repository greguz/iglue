import { AttributeValueInfo, Value } from "../interfaces/AttributeInfo";
import { Context } from "../interfaces/Context";
import { Formatter, FormatterFunction } from "../interfaces/Formatter";
import { Observer } from "../interfaces/Observer";

import {
  isFunction,
  isObject,
  toThrow,
  parsePath,
  Collection,
  passthrough
} from "../utils";

/**
 * Full formatter
 */
interface F {
  pull: FormatterFunction;
  push: FormatterFunction;
}

/**
 * TODO: docs
 */
function getFormatter(
  formatters: Collection<Formatter | FormatterFunction>,
  name: string
): F {
  const definition = formatters[name];
  if (isFunction(definition)) {
    return {
      pull: definition,
      push: toThrow(`Formatter "${name}" does not have push function`)
    };
  } else if (isObject(definition)) {
    return {
      pull:
        definition.pull ||
        toThrow(`Formatter "${name}" does not have pull function`),
      push:
        definition.push ||
        toThrow(`Formatter "${name}" does not have push function`)
    };
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
  { pull, push }: F,
  values: Value[]
): F {
  const getters = values.map(value => buildValueGetter(context, value));

  function args(first: any): any[] {
    const args = getters.map(getter => getter());
    args.unshift(first);
    return args;
  }

  return {
    pull(value: any): any {
      return pull.apply(this, args(value));
    },
    push(value: any): any {
      return push.apply(this, args(value));
    }
  };
}

/**
 * Compose formatters array into a single formatter
 */
function composeFormatters(formatters: F[]): F {
  function reducer(acc: FormatterFunction, current: FormatterFunction) {
    return function map(value: any): any {
      return current.call(this, acc.call(this, value));
    };
  }
  return {
    pull: formatters
      .map(formatter => formatter.pull)
      .reduce(reducer, passthrough),
    push: formatters
      .map(formatter => formatter.push)
      .reduceRight(reducer, passthrough)
  };
}

/**
 * Parse single expression into an Observer
 */
export function parseExpression(
  context: Context,
  formatters: Collection<Formatter | FormatterFunction>,
  expression: AttributeValueInfo,
  callback?: (value: any) => void
): Observer {
  // Compose all formatters and bind arguments
  const { pull, push } = composeFormatters(
    expression.formatters.map(entry =>
      bindFormatterArguments(
        context,
        getFormatter(formatters, entry.name),
        entry.arguments
      )
    )
  );

  // Target value getter
  const getSourceValue = buildValueGetter(context, expression.value);

  // Compose getter and formatters
  function get(): any {
    return pull.call(context, getSourceValue());
  }

  // Target value setter
  const setTargetValue = buildValueSetter(context, expression.value);

  // Compose setter and formatters
  function set(value: any): void {
    setTargetValue(push.call(context, value));
  }

  // Get paths to watch
  const paths = isFunction(callback) ? getPaths(expression) : [];

  // Change callback function
  function notify(): void {
    (callback as any).call(context, get());
  }

  // Observe paths (start change reactivity)
  for (const path of paths) {
    context.$observe(path, notify);
  }

  // Stop change reactivity function
  function unobserve(): void {
    for (const path of paths) {
      context.$unobserve(path, notify);
    }
  }

  // Return observer instance
  return {
    get,
    set,
    unobserve
  };
}
