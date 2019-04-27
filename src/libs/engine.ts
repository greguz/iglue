import { Context } from "../interfaces/Context";
import { Expression } from "../interfaces/Expression";
import { Formatter, FormatterFunction } from "../interfaces/Formatter";
import { Target } from "../interfaces/Target";

import { uniq } from "../utils/array";
import { isArray, isFunction, isObject, parsePath } from "../utils/language";
import { Collection, Getter, Setter } from "../utils/type";

type Mapper = (value: any) => any;

function passthrough<T>(value: T): T {
  return value;
}

/**
 * Compose two mappers into a single one, preserve the context
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
 * Wrap a error inside a function
 */
function wrapError(message: string): (...args: any[]) => any {
  return function ko(): void {
    throw new Error(message);
  };
}

/**
 * Wrap a const value inside a function
 */
function wrapConst<T>(value: T) {
  return function get() {
    return value;
  };
}

/**
 * Get and ensure a full formatter
 */
function getFormatter(
  formatters: Collection<Formatter | FormatterFunction>,
  name: string
): Formatter {
  const definition = formatters[name];

  const noPull = wrapError(`Formatter ${name} does not have pull function`);
  const noPush = wrapError(`Formatter ${name} does not have push function`);

  if (isFunction(definition)) {
    return {
      pull: definition,
      push: noPush
    };
  } else if (isObject(definition)) {
    return {
      pull: definition.pull || noPull,
      push: definition.push || noPush
    };
  } else {
    throw new Error(`Unable to resolve formatter "${name}"`);
  }
}

/**
 * Build getter function by path
 */
function buildGetter(path: string): Getter {
  const tokens = parsePath(path);

  return function get(this: any): any {
    let o = this;

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
 * Build setter function by path
 */
function buildSetter(path: string): Setter {
  const tokens = parsePath(path);

  return function set(this: any, value: any): void {
    let o = this;
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
 * Map target to getter
 */
function buildTargetGetter(target: Target): Getter {
  return target.type === "path"
    ? buildGetter(target.value)
    : wrapConst(target.value);
}

/**
 * Map target to setter
 */
function buildTargetSetter(target: Target): Setter {
  return target.type === "path"
    ? buildSetter(target.value)
    : wrapError("You cannot update a primitive value");
}

/**
 * Bind formatter arguments (targets)
 */
function bindFormatterArguments(
  format: FormatterFunction,
  targets: Target[]
): Mapper {
  if (targets.length <= 0) {
    return format;
  }

  const getters = targets.map(buildTargetGetter);
  if (getters.length === 1) {
    return function boundFormatter(value: any): any {
      return format.call(this, value, getters[0].call(this));
    };
  } else if (getters.length === 2) {
    return function boundFormatter(value: any): any {
      return format.call(
        this,
        value,
        getters[0].call(this),
        getters[1].call(this)
      );
    };
  } else {
    return function boundFormatter(value: any): any {
      return format.apply(this, [
        value,
        ...getters.map(getter => getter.call(this))
      ]);
    };
  }
}

/**
 * Build getter by expression
 */
export function buildExpressionGetter<T = any>(
  expression: Expression,
  formatters: Collection<Formatter | FormatterFunction> = {}
): Getter<T> {
  const pull = reduceMappers(
    expression.formatters.map(entry =>
      bindFormatterArguments(
        getFormatter(formatters, entry.name).pull,
        entry.targets
      )
    )
  );

  const getSourceValue = buildTargetGetter(expression.target);

  return function get(): any {
    return pull.call(this, getSourceValue.call(this));
  };
}

/**
 * Build setter by expression
 */
export function buildExpressionSetter<T = any>(
  expression: Expression,
  formatters: Collection<Formatter | FormatterFunction> = {}
): Setter<T> {
  const push = reduceMappers(
    expression.formatters.map(entry =>
      bindFormatterArguments(
        getFormatter(formatters, entry.name).push,
        entry.targets
      )
    )
  );

  const setTargetValue = buildTargetSetter(expression.target);

  return function set(value: any): void {
    setTargetValue.call(this, push.call(this, value));
  };
}

/**
 * Get all used paths by the expression
 */
function getPaths({ formatters, target, watch }: Expression): string[] {
  const paths: string[] = [];
  if (target.type === "path") {
    paths.push(target.value);
  }
  for (const path of watch) {
    paths.push(path);
  }
  for (const formatter of formatters) {
    for (const fTarget of formatter.targets) {
      if (fTarget.type === "path") {
        paths.push(fTarget.value);
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
  expression: Expression,
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
