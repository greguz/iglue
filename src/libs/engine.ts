import { Context, ContextCallback } from "../interfaces/Context";
import { Expression } from "../interfaces/Expression";
import { Formatter, FormatterFunction } from "../interfaces/Formatter";
import { Target } from "../interfaces/Target";

import { uniq } from "../utils/array";
import { wrapConst, wrapError, voidReducer } from "../utils/engine";
import { isArray, isFunction, isObject, isUndefined } from "../utils/language";
import { parsePath } from "../utils/object";
import { Collection, Getter, Setter } from "../utils/type";

type Mapper = (value: any) => any;

/**
 * Compose two mappers into a single one, preserve the context
 */
function composeMappers(first: Mapper, second: Mapper): Mapper {
  return function composedMapper(this: any, value: any): any {
    return second.call(this, first.call(this, value));
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

  if (isFunction(definition)) {
    return {
      pull: definition,
      push: wrapError(`Formatter "${name}" does not have push function`)
    };
  } else if (isObject(definition)) {
    return definition;
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

      if (isUndefined(o[token])) {
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
export function buildExpressionGetter(
  expression: Expression,
  formatters: Collection<Formatter | FormatterFunction> = {}
): Getter {
  // Build base target getter
  const getValue = buildTargetGetter(expression.target);

  // Clean getter without formatters, return the base getter
  if (expression.formatters.length <= 0) {
    return getValue;
  }

  // Build single format function
  const pull = expression.formatters
    .map(entry =>
      bindFormatterArguments(
        getFormatter(formatters, entry.name).pull,
        entry.targets
      )
    )
    .reduce(composeMappers);

  // Compose getter and formatters
  return function get(): any {
    return pull.call(this, getValue.call(this));
  };
}

/**
 * Build setter by expression
 */
export function buildExpressionSetter(
  expression: Expression,
  formatters: Collection<Formatter | FormatterFunction> = {}
): Setter {
  // Build base target setter
  const setValue = buildTargetSetter(expression.target);

  // Clean setter without formatters
  if (expression.formatters.length <= 0) {
    return setValue;
  }

  // Build single format function
  const push = expression.formatters
    .map(entry =>
      bindFormatterArguments(
        getFormatter(formatters, entry.name).push,
        entry.targets
      )
    )
    .reduce(composeMappers);

  // Compose setter and formatters
  return function set(value: any): void {
    setValue.call(this, push.call(this, value));
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
 * Observe single path value
 */
export function observePath(
  context: Context,
  path: string,
  callback: ContextCallback
): VoidFunction {
  context.$observe(path, callback);
  return context.$unobserve.bind(context, path, callback);
}

/**
 * Observe expression targets
 */
export function observeExpression(
  context: Context,
  expression: Expression,
  callback: VoidFunction
): VoidFunction {
  return getPaths(expression)
    .map(path => observePath(context, path, callback))
    .reduce(voidReducer);
}
