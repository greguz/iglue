import { AttributeValueInfo, FormatterInfo, PrimitiveValue, Value } from "./interfaces/AttributeInfo";
import { AttributeParser } from "./interfaces/AttributeParser";
import { Binder } from "./interfaces/Binder";
import { Binding } from "./interfaces/Binding";
import { Chunk } from "./interfaces/Chunk";
import { Component } from "./interfaces/Component";
import { Context } from "./interfaces/Context";
import { Directive } from "./interfaces/Directive";
import { Formatter } from "./interfaces/Formatter";
import { Observer, ObserverCallback } from "./interfaces/Observer";
import { View, ViewOptions } from "./interfaces/View";

import { Mapper, assign, mapCollection, isObject } from "./utils";

import { buildAttributeParser } from "./parse/attribute";
import { parseText } from "./parse/text";

import { buildContext } from "./context";

import { buildBinderDirective } from "./directives/binder";
import { buildComponentDirective } from "./directives/component";
import { buildConditionalDirective } from "./directives/conditional";
import { buildListDirective } from "./directives/list";
import { buildTextDirective } from "./directives/text";

import { mapBinder, mapComponent, mapFormatter } from "./mappers";

/**
 * Represents a reactive DOM element
 */

interface Subscription {
  refresh(): void;
  unbind(): void;
}

/**
 * Map a primitive value into an observer instance
 */

function wrapPrimitiveValue(primitive: PrimitiveValue): Observer {
  return {
    get(): string | number | boolean {
      return primitive.value;
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

function wrapValue(value: Value, context: Context, callback: ObserverCallback): Observer {
  if (value.type === "path") {
    return context.$observe(value.value, callback);
  } else {
    return wrapPrimitiveValue(value);
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
 * Parse template expression into observer
 */

function parseExpression(
  expression: string,
  parser: AttributeParser,
  context: Context,
  getFormatter: Mapper<string, Formatter>,
  callback: ObserverCallback
): Observer {
  // parse expression string
  const info: AttributeValueInfo = parser.parseValue(expression);

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
}

/**
 * Create a new view
 */

export function buildView(el: HTMLElement, obj: any, options?: ViewOptions): View {
  // input validation
  if (!isObject(obj)) {
    throw new Error("Invalid context");
  }

  // build context object
  const context: Context = buildContext(obj);

  // resolvers
  const getBinder: Mapper<string, Binder> = mapCollection(options.binders, mapBinder);
  const getComponent: Mapper<string, Component> = mapCollection(options.components, mapComponent);
  const getFormatter: Mapper<string, Formatter> = mapCollection(options.formatters, mapFormatter);

  // DOM attribute parser
  const parser: AttributeParser = buildAttributeParser(options.prefix || "i-");

  // active subscriptions
  const subscriptions: Subscription[] = [];

  /**
   * Clone the current view configuration and optinally the model
   */

  function cloneView(el: HTMLElement, obj?: object): View {
    return buildView(el, obj || context, options);
  }

  /**
   * Shortcut
   */

  function parseExpressionUtility(expression: string, callback: ObserverCallback): Observer {
    return parseExpression(
      expression,
      parser,
      context,
      getFormatter,
      callback
    );
  }

  /**
   * Build attribute binding
   */

  function buildBinding(el: HTMLElement, attrName: string): Binding {
    return assign(
      { el, context },
      parser.parse(el, attrName)
    );
  }

  /**
   * Build and save a new subscription by directive and expression
   */

  function subscribe(directive: Directive, expression: string): void {
    const observer: Observer = parseExpressionUtility(expression, directive.refresh);
    subscriptions.push({
      refresh(): void {
        directive.refresh(observer.get());
      },
      unbind(): void {
        observer.unobserve();
        directive.unbind();
      }
    });
  }

  /**
   * Load single binder subscription
   */

  function loadBinder(el: HTMLElement, attrName: string): void {
    const binding: Binding = buildBinding(el, attrName);
    const binder: Binder = getBinder(binding.directive);
    const directive: Directive = buildBinderDirective(binder, binding);
    subscribe(directive, el.getAttribute(attrName));
  }

  /**
   * Load the custom binders for the current node
   */

  function loadBinders(el: HTMLElement): void {
    for (let i = 0; i < el.attributes.length; i++) {
      const attr: Attr = el.attributes[i];
      if (parser.match(attr.name)) {
        loadBinder(el, attr.name);
      }
    }
  }

  /**
   * Load conditional directive
   */

  function loadConditionalDirective(el: HTMLElement, attrName: string): void {
    const directive: Directive = buildConditionalDirective({
      binding: buildBinding(el, attrName),
      view: cloneView
    });
    subscribe(directive, el.getAttribute(attrName));
  }

  /**
   * Parse a text node and create its directives
   */

  function injectTextNodes(node: Text): void {
    // IE11 fix, use parentNode instead of parentElement
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/parentElement
    const parent: HTMLElement = node.parentNode as HTMLElement;
    const chunks: Chunk[] = parseText(node.data, /{([^}]+)}/g);

    for (const chunk of chunks) {
      if (chunk.type === "static") {
        parent.insertBefore(
          document.createTextNode(chunk.content),
          node
        );
      } else {
        const expression: string = chunk.content;
        const directive: Directive = buildTextDirective(
          parent.insertBefore(
            document.createTextNode(`{ ${expression} }`),
            node
          )
        );
        subscribe(directive, expression);
      }
    }

    parent.removeChild(node);
  }

  /**
   * Load and initialize a list directive
   */

  function loadListDirective(el: HTMLElement, attrName: string): void {
    const directive: Directive = buildListDirective({
      binding: buildBinding(el, attrName),
      view: cloneView
    });
    subscribe(directive, el.getAttribute(attrName));
  }

  /**
   * TODO docs
   */

  function linkProperty(target: any, property: string, expression: string): Observer {
    // value change callback
    function callback(value: any): void {
      target[property] = value;
    }

    // create the observer
    const observer: Observer = parseExpressionUtility(expression, callback);

    // init the object value
    callback(observer.get());

    // return the created observer
    return observer;
  }

  /**
   * Load a component
   */

  function loadComponent(el: HTMLElement): void {
    // component context
    const cc: any = {};

    // used observers
    const observers: Observer[] = [];

    // link property from parent to child
    for (let i = 0; i < el.attributes.length; i++) {
      const attr: Attr = el.attributes[i];
      if (!parser.match(attr.value)) {
        observers.push(
          linkProperty(cc, attr.name, attr.value)
        );
      }
    }

    // build the component directive
    const directive: Directive = buildComponentDirective({
      el,
      context: cc,
      components: getComponent,
      view: cloneView
    });

    // set the first observer (the one that represents the component name)
    if (el.hasAttribute("is")) {
      observers.unshift(
        parseExpressionUtility(
          el.getAttribute("is"),
          directive.refresh
        )
      );
    } else {
      observers.unshift(
        wrapPrimitiveValue({
          type: "primitive",
          value: el.tagName.toLowerCase()
        })
      );
    }

    // register the subscription
    subscriptions.push({
      refresh(): void {
        directive.refresh(observers[0].get());
      },
      unbind(): void {
        for (const observer of observers) {
          observer.unobserve();
        }
        directive.unbind();
      }
    });
  }

  /**
   * Traverse DOM nodes and save bindings
   */

  function traverseDOM(node: Node): void {
    if (node.nodeType === 3) {
      injectTextNodes(node as Text);
    } else if (node.nodeType === 1) {
      const el: HTMLElement = node as HTMLElement;

      const eachAttr: string = parser.getAttributeByDirective(el, "each");
      const ifAttr: string = parser.getAttributeByDirective(el, "if");
      const cName: string = node.nodeName.toLowerCase();

      if (eachAttr) {
        loadListDirective(el, eachAttr);
      } else if (ifAttr) {
        loadConditionalDirective(el, ifAttr);
      } else if (cName === "component" || options.components.hasOwnProperty(cName)) {
        loadComponent(el);
      } else {
        loadBinders(el);
        for (let i = 0; i < el.childNodes.length; i++) {
          traverseDOM(el.childNodes[i]);
        }
      }
    }
  }

  /**
   * View#refresh
   */

  function refresh(): void {
    for (const subscription of subscriptions) {
      subscription.refresh();
    }
  }

  /**
   * View#unbind
   */

  function unbind(): void {
    for (const subscription of subscriptions) {
      subscription.unbind();
    }
  }

  // render the UI
  traverseDOM(el);
  refresh();

  // return the view instance
  return {
    el,
    context,
    refresh,
    unbind
  };
}
