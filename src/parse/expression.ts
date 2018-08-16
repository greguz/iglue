import { AttributeValueInfo, FormatterInfo, Value } from "../interfaces/AttributeInfo";
import { AttributeParser } from "../interfaces/AttributeParser";
import { Context } from "../interfaces/Context";
import { Formatter, FormatterFunction } from "../interfaces/Formatter";
import { Observer } from "../interfaces/Observer";

import { isFunction, isObject, throwError, parsePath, Collection, Mapper, mapCollection, passthrough } from "../utils";

/**
 * Simple generic mapper (just one argument)
 */

type Format = Mapper<any, any>;

/**
 * Getter function
 */

type Getter = () => any;

/**
 * Setter function
 */

type Setter = (value: any) => void;

/**
 * Map a formatter definition to a full formatter object
 */

export function mapFormatter(definition: Formatter | FormatterFunction, name: string): Formatter {
  if (isFunction(definition)) {
    return {
      pull: definition as FormatterFunction,
      push: throwError(`Formatter "${name}" does not have push function`)
    };
  } else if (isObject(definition)) {
    return {
      pull: (definition as Formatter).pull || throwError(`Formatter "${name}" does not have pull function`),
      push: (definition as Formatter).push || throwError(`Formatter "${name}" does not have push function`)
    };
  } else {
    throw new Error(`Unable to resolve formatter "${name}"`);
  }
}

/**
 * Build a getter function by object and path
 */

function buildGetter(obj: any, path: string): Getter {
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

function buildSetter(obj: any, path: string): Setter {
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

function buildValueGetter(context: Context, value: Value): Getter {
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

function buildValueSetter(context: Context, value: Value): Setter {
  if (value.type === "path") {
    return buildSetter(context, value.value);
  } else {
    return function set(): void {
      throw new Error("You cannot update a primitive value");
    };
  }
}

/**
 * Get all used paths by the expression
 */

function getPaths(info: AttributeValueInfo): string[] {
  const paths: string[] = [];

  if (info.value.type === "path") {
    paths.push(info.value.value);
  }

  for (const path of info.watch) {
    paths.push(path);
  }

  for (const fi of info.formatters) {
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

function bindFormatterArguments(context: Context, formatter: Formatter, values: Value[]): Formatter {
  const getters: Getter[] = values.map(
    (value: Value): Getter => buildValueGetter(context, value)
  );

  function getArguments(value: any): any[] {
    const args: any[] = getters.map(
      (getter: Getter): any => getter()
    );
    args.unshift(value);
    return args;
  }

  return {
    pull(value: any): any {
      return formatter.pull.apply(this, getArguments(value));
    },
    push(value: any): any {
      return formatter.push.apply(this, getArguments(value));
    }
  };
}

/**
 * Compose functions
 */

function compose(formats: Format[]): Format {
  return formats.reduce((previous: Format, next: Format): Format => {
    return function map(value: any): any {
      return next.call(this, previous.call(this, value));
    };
  }, passthrough);
}

/**
 * Pipe functions
 */

function pipe(formats: Format[]): Format {
  return formats.reduceRight((previous: Format, next: Format): Format => {
    return function map(value: any): any {
      return next.call(this, previous.call(this, value));
    };
  }, passthrough);
}

/**
 * Expression parser type
 */

export type ExpressionParser = (expression: string, callback: (value: any) => void) => Observer;

/**
 * Parse template expression into observer
 */

export function buildExpressionParser(
  attributeParser: AttributeParser,
  context: Context,
  formatters: Collection<Formatter | FormatterFunction>
): ExpressionParser {
  // map the formatter collection
  const getFormatter: Mapper<string, Formatter> = mapCollection(formatters, mapFormatter);

  // return the parse function
  return function parseExpression(expression: string, callback: (value: any) => void): Observer {
    // parse expression string
    const info: AttributeValueInfo = attributeParser.parseValue(expression);

    // bind formatter arguments
    const formatters: Formatter[] = info.formatters.map(
      (fi: FormatterInfo): Formatter => bindFormatterArguments(
        context,
        getFormatter(fi.name),
        fi.arguments
      )
    );

    // map formatters and compose the "pull value" function
    const pull: Format = compose(
      formatters.map(
        (formatter: Formatter): Format => formatter.pull
      )
    );

    // getter for the source value from the store
    const getSourceValue: Getter = buildValueGetter(context, info.value);

    // get current value
    function get(): any {
      return pull.call(context, getSourceValue());
    }

    // map formatters and compose the "push value" function
    const push: Format = pipe(
      formatters.map(
        (formatter: Formatter): Format => formatter.push
      )
    );

    // update store value
    const setTargetValue: Setter = buildValueSetter(context, info.value);

    // set current value
    function set(value: any): void {
      setTargetValue(push.call(context, value));
    }

    // get paths used by the expression
    const paths: string[] = getPaths(info);

    // notification callback to call
    function notify(): void {
      callback(get());
    }

    // start the reactivity
    for (const path of paths) {
      context.$observe(path, notify);
    }

    // stop the reactivity
    function unobserve(): void {
      for (const path of paths) {
        context.$unobserve(path, notify);
      }
    }

    // return the observer instance
    return {
      get,
      set,
      unobserve
    };
  };
}
