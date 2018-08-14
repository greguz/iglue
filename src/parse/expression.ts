import { AttributeValueInfo, FormatterInfo, Value } from "../interfaces/AttributeInfo";
import { AttributeParser } from "../interfaces/AttributeParser";
import { Context } from "../interfaces/Context";
import { Formatter } from "../interfaces/Formatter";
import { Observer, ObserverCallback } from "../interfaces/Observer";

import { mapFormatter } from "../mappers";
import { Collection, Mapper, mapCollection } from "../utils";

/**
 * Map a primitive value into an observer instance
 */

export function wrapPrimitiveValue(value: string | number | boolean): Observer {
  return {
    get(): string | number | boolean {
      return value;
    },
    set(): void {
      throw new Error("It is not possible to update a primitive value");
    },
    unobserve(): void {
      // nothing to do
    }
  };
}

/**
 * Map value into observer
 */

export function wrapValue(value: Value, context: Context, callback: ObserverCallback): Observer {
  if (value.type === "path") {
    return context.$observe(value.value, callback);
  } else {
    return wrapPrimitiveValue(value.value);
  }
}

/**
 * Add paths watching to an existing observer
 */

function watchPaths(
  observer: Observer,
  watch: string[],
  context: Context,
  callback: ObserverCallback
): Observer {
  // observe all configured paths
  const observers: Observer[] = watch.map(
    (path: string): Observer => context.$observe(path, callback)
  );

  // return the wrapper
  return {
    get(): any {
      return observer.get();
    },
    set(value: any): void {
      return observer.set(value);
    },
    unobserve(): void {
      observer.unobserve();
      for (const o of observers) {
        o.unobserve();
      }
    }
  };
}

/**
 * Apply a formatter to observer instance
 */

function applyFormatter(
  observer: Observer,
  context: Context,
  info: FormatterInfo,
  getFormatter: Mapper<string, Formatter>,
  callback: ObserverCallback
): Observer {
  // resolve the formatter
  const formatter: Formatter = getFormatter(info.name);

  // map formatter arguments into observers
  const observers: Observer[] = info.arguments.map(
    (arg: Value): Observer => wrapValue(arg, context, callback)
  );

  // get the formatter function argument values array
  function getFormatterArguments(): any[] {
    const result: any[] = observers.map(
      (o: Observer): any => o.get()
    );
    result.unshift(observer.get());
    return result;
  }

  // return the wrapper
  return {
    get(): any {
      return formatter.apply(context, getFormatterArguments());
    },
    set(): void {
      throw new Error("You cannot update the value of an expression");
    },
    unobserve(): void {
      observer.unobserve();
      for (const o of observers) {
        o.unobserve();
      }
    }
  };
}

/**
 * Expression parser type
 */

export type ExpressionParser = (expression: string, callback: ObserverCallback) => Observer;

/**
 * Parse template expression into observer
 */

export function buildExpressionParser(attributeParser: AttributeParser, context: Context, formatters: Collection<Formatter>): ExpressionParser {
  // map the formatter collection
  const getFormatter: Mapper<string, Formatter> = mapCollection(formatters, mapFormatter);

  // return the parse function
  return function parseExpression(expression: string, callback: ObserverCallback): Observer {
    // parse expression string
    const info: AttributeValueInfo = attributeParser.parseValue(expression);

    // create the base value observer
    let observer: Observer = wrapValue(info.value, context, callback);

    // handle watched paths
    if (info.watch.length > 0) {
      observer = watchPaths(observer, info.watch, context, callback);
    }

    // add formattes
    for (const i of info.formatters) {
      observer = applyFormatter(
        observer,
        context,
        i,
        getFormatter,
        callback
      );
    }

    // return the observer
    return observer;
  };
}
