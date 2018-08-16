import { AttributeInfo } from "./interfaces/AttributeInfo";
import { AttributeParser } from "./interfaces/AttributeParser";
import { Binder } from "./interfaces/Binder";
import { Binding } from "./interfaces/Binding";
import { Chunk } from "./interfaces/Chunk";
import { Component } from "./interfaces/Component";
import { Context } from "./interfaces/Context";
import { Directive } from "./interfaces/Directive";
import { Observer } from "./interfaces/Observer";
import { View, ViewOptions } from "./interfaces/View";

import { Collection, Mapper, assign, mapCollection, isObject, noop } from "./utils";

import { buildAttributeParser } from "./parse/attribute";
import { buildExpressionParser, ExpressionParser } from "./parse/expression";
import { parseText } from "./parse/text";

import { buildContext } from "./context";

import { buildBinderDirective } from "./directives/binder";
import { buildComponentDirective } from "./directives/component";
import { buildConditionalDirective } from "./directives/conditional";
import { buildListDirective } from "./directives/list";
import { buildTextDirective } from "./directives/text";

import { mapBinder, mapComponent } from "./mappers";

/**
 * Represents a reactive DOM element
 */

interface Subscription {
  refresh(): void;
  unbind(): void;
}

/**
 * Binding interface plus "private" properties
 */

interface ExtendedBinding extends Binding {
  observer: Observer;
}

/**
 * Build a binding instance
 */

function buildBinding(el: HTMLElement, attrName: string, context: Context, parser: AttributeParser): ExtendedBinding {
  function get(this: ExtendedBinding): any {
    if (this.observer === null) {
      throw new Error("The value is not bound yet");
    }
    return this.observer.get();
  }

  function set(this: ExtendedBinding, value: any): void {
    if (this.observer === null) {
      throw new Error("The value is not bound yet");
    }
    this.observer.set(value);
  }

  return assign(
    { el, context, get, set, observer: null },
    parser.parse(el, attrName)
  );
}

/**
 * Create a reactive value link between the value of an expression and a property
 */

function link(parseExpression: ExpressionParser, obj: any, property: string, expression: string): Observer {
  // value change callback
  function callback(value: any): void {
    obj[property] = value;
  }

  // create the observer
  const observer: Observer = parseExpression(expression, callback);

  // init the object value
  callback(observer.get());

  // return the created observer
  return observer;
}

/**
 * Build a map function event name to event listener
 */

function buildEventListenerMapper(parseExpression: ExpressionParser) {
  // return the mapper function
  return function mapEventListener(expression: string, event: string): Function {
    // handle not configured listeners
    if (!expression) {
      return noop;
    }

    // create a dead observer (no reactivity)
    const observer: Observer = parseExpression(expression, noop);
    observer.unobserve();

    // get its value
    const listener: Function = observer.get();

    // ensure function type
    if (typeof listener !== "function") {
      throw new Error(`Found an invalid listener for event "${event}" bound with "${expression}"`);
    }

    // all done
    return listener;
  };
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

  // parsers
  const attributeParser: AttributeParser = buildAttributeParser(options.prefix || "i-");
  const parseExpression: ExpressionParser = buildExpressionParser(attributeParser, context, options.formatters);

  // active subscriptions
  const subscriptions: Subscription[] = [];

  /**
   * Clone the current view configuration and optinally the model
   */

  function cloneView(el: HTMLElement, obj?: object): View {
    return buildView(el, obj || context, options);
  }

  /**
   * Build and save a new subscription by directive and expression
   */

  function subscribe(directive: Directive, expression: string): void {
    const observer: Observer = parseExpression(expression, directive.refresh);
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
    const binding: ExtendedBinding = buildBinding(el, attrName, context, attributeParser);
    const binder: Binder = getBinder(binding.directive);
    const directive: Directive = buildBinderDirective(binder, binding);
    const observer: Observer = parseExpression(
      binding.attrValue,
      directive.refresh
    );
    binding.observer = observer;
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
   * Load the custom binders for the current node
   */

  function loadBinders(el: HTMLElement): void {
    const names: string[] = [];
    for (let i = 0; i < el.attributes.length; i++) {
      const attr: Attr = el.attributes[i];
      if (attributeParser.match(attr.name)) {
        names.push(attr.name);
      }
    }
    for (const name of names) {
      loadBinder(el, name);
    }
  }

  /**
   * Load conditional directive
   */

  function loadConditionalDirective(el: HTMLElement, attrName: string): void {
    const info: AttributeInfo = attributeParser.parse(el, attrName);
    const directive: Directive = buildConditionalDirective({
      el,
      info,
      buildView: cloneView
    });
    subscribe(directive, info.attrValue);
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
    const info: AttributeInfo = attributeParser.parse(el, attrName);
    const directive: Directive = buildListDirective({
      el,
      context,
      info,
      buildView: cloneView
    });
    subscribe(directive, info.attrValue);
  }

  /**
   * Load a component
   */

  function loadComponent(el: HTMLElement): void {
    // component context
    const cc: any = {};

    // used observers
    const observers: Observer[] = [];

    // event name to expression collection
    const events: Collection<string> = {};

    // link property from parent to child
    for (let i = 0; i < el.attributes.length; i++) {
      const attr: Attr = el.attributes[i];
      if (attributeParser.match(attr.name)) {
        const info = attributeParser.parse(el, attr.name);
        if (info.directive === "on" && info.argument) {
          events[info.argument.toLowerCase()] = attr.value;
        }
      } else {
        observers.push(
          link(parseExpression, cc, attr.name, attr.value)
        );
      }
    }

    // build the component directive
    const directive: Directive = buildComponentDirective({
      el,
      context: cc,
      getComponent,
      buildView: cloneView
    });

    // map the event name to listener
    const getEventListener: Mapper<string, Function> = mapCollection(
      events,
      buildEventListenerMapper(parseExpression)
    );

    // inject the $emit API into component context
    Object.defineProperty(cc, "$emit", {
      value: function $emit(event: string, ...args: any[]): void {
        getEventListener(event).apply(context, args);
      }
    });

    // set the first observer (the one that represents the component name)
    if (el.hasAttribute("is")) {
      observers.unshift(
        parseExpression(
          el.getAttribute("is"),
          directive.refresh
        )
      );
    } else {
      observers.unshift({
        get(): string {
          return el.tagName.toLowerCase();
        },
        set(): void {
          throw new Error("You cannot update a primitive value");
        },
        unobserve(): void {
          // nothing to do
        }
      });
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

      const eachAttr: string = attributeParser.getAttributeByDirective(el, "each");
      const ifAttr: string = attributeParser.getAttributeByDirective(el, "if");
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
