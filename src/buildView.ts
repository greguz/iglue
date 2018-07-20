import { assign, mapCollection, passthrough } from "./utils";

import {
  IAttributeParser,
  IAttributeValueInfo,
  IFormatterInfo,
  ITarget
} from "./interfaces/IAttributeParser";
import { IBinder, IBinderRoutine } from "./interfaces/IBinder";
import { IBinding } from "./interfaces/IBinding";
import { IComponent } from "./interfaces/IComponent";
import { IContext } from "./interfaces/IContext";
import { IDirective } from "./interfaces/IDirective";
import { Formatter, IFormatter } from "./interfaces/IFormatter";
import { IObserver, IObserverCallback } from "./interfaces/IObserver";
import { IView, IViewOptions } from "./interfaces/IView";

import { buildAttributeParser } from "./parse/attribute";
import { parseText } from "./parse/text";

import { buildContext } from "./context";

import { buildBinderDirective } from "./directives/binder";
import { buildComponentDirective } from "./directives/component";
import { buildConditionalDirective } from "./directives/conditional";
import { buildListDirective } from "./directives/list";
import { buildTextDirective } from "./directives/text";

type MakeObserver = (path: string, callback?: IObserverCallback) => IObserver;

function wrapTarget(
  target: ITarget,
  observe: MakeObserver,
  callback?: IObserverCallback
): IObserver {
  if (target.type === "path") {
    return observe(target.value, callback);
  } else {
    return {
      get(): any {
        return target.value;
      },
      set(): void {
        throw new Error("It is not possible to update a primitive value");
      },
      notify(): void {
        // nothing
      }
    };
  }
}

function buildFormatters(
  infos: IFormatterInfo[],
  observe: MakeObserver,
  resolveFormatter: (name: string) => IFormatter,
  callback: IObserverCallback
): IFormatter[] {
  return infos.map((info: IFormatterInfo): IFormatter => {
    const formatter: IFormatter = resolveFormatter(info.name);

    const observers: IObserver[] = info.arguments.map(
      (target: ITarget): IObserver => wrapTarget(target, observe, callback)
    );

    function args() {
      return observers.map(
        (observer: IObserver): any => observer.get()
      );
    }

    return {
      pull(value: any): any {
        return formatter.pull(value, ...args());
      },
      push(value: any): any {
        return formatter.push(value, ...args());
      }
    };
  });
}

function parseExpression(
  expression: string,
  parser: IAttributeParser,
  observe: MakeObserver,
  resolveFormatter: (name: string) => IFormatter
): IObserver {
  // parse expression string
  const info: IAttributeValueInfo = parser.parseValue(expression);

  // root value observer
  const observer: IObserver = wrapTarget(info.value, observe);

  // registered callback for the resulting observer
  let superCallback: IObserverCallback;

  // notification callback function
  const callback = (): void => {
    if (superCallback) {
      superCallback(get(), null); // TODO oldValue
    }
  };

  // watch base value changes
  observer.notify(callback);

  // build the formatters
  const formatters: IFormatter[] = buildFormatters(
    info.formatters,
    observe,
    resolveFormatter,
    callback
  );

  // register watched paths
  for (const watchedPath of info.watch) {
    observe(watchedPath, callback);
  }

  // get the current value
  function get(): any {
    let value: any = observer.get();
    for (const formatter of formatters) {
      value = formatter.pull(value);
    }
    return value;
  }

  // set the value
  function set(value: any): void {
    for (const formatter of formatters) {
      value = formatter.push(value);
    }
    observer.set(value);
  }

  // register change callback
  function notify(fn: IObserverCallback): void {
    superCallback = fn;
  }

  // return the observer
  return {
    get,
    set,
    notify
  };
}

function mapBinder(definition: IBinder | IBinderRoutine, name: string): IBinder {
  if (typeof definition === "object" && definition !== null) {
    // full configured binder
    return definition;
  } else if (typeof definition === "function") {
    // simple binder, just the routine function
    return { routine: definition };
  } else {
    // fallback to default binder, bind the element attribute
    return {
      routine(el: HTMLElement, value: any): void {
        if (value == null) {
          el.removeAttribute(name);
        } else {
          el.setAttribute(name, value.toString());
        }
      }
    };
  }
}

function mapComponent(definition: IComponent, name: string): IComponent {
  // just ensure the component object
  if (typeof definition === "object" && definition !== null) {
    return definition;
  } else {
    throw new Error(`Unable to find component "${name}"`);
  }
}

function mapFormatter(definition: IFormatter | Formatter, name: string): IFormatter {
  if (typeof definition === "object" && definition !== null) {
    // full configured formatter
    return definition;
  } else if (typeof definition === "function") {
    // simple formatter, just the pull function
    return {
      pull: definition,
      push: passthrough
    };
  } else {
    // error
    throw new Error(`Unable to find formatter "${name}"`);
  }
}

function getObserverBuilder(context: IContext, isBound: () => boolean): MakeObserver {
  function wrap(callback: IObserverCallback): IObserverCallback {
    return function wrapped(newValue: any, oldValue: any): void {
      if (isBound()) {
        callback(newValue, oldValue);
      }
    };
  }
  return function observe(path: string, c0?: IObserverCallback): IObserver {
    const observer: IObserver = context.$observe(
      path,
      c0 == null ? null : wrap(c0)
    );
    return {
      get: observer.get,
      set: observer.set,
      notify(c1: IObserverCallback): void {
        observer.notify(wrap(c1));
      }
    };
  };
}

export function buildView(el: HTMLElement, obj: any, options?: IViewOptions): IView {
  // build the view context
  let context: IContext;
  if (typeof obj.$clone === "function" && obj.hasOwnProperty("$clone")) {
    context = obj.$clone();
  } else {
    context = buildContext(obj);
  }

  // bound flag
  let bound: boolean = false;

  // loaded directives
  const directives: IDirective[] = [];

  /**
   * Bind data and DOM
   */

  function bind(): void {
    // update status
    bound = true;
    // initialize directives
    for (const directive of directives) {
      directive.bind();
    }
    // call first routine
    for (const directive of directives) {
      directive.refresh();
    }
  }

  /**
   * Refresh the DOM
   */

  function refresh(): void {
    // call the routine for all directives
    for (const directive of directives) {
      directive.refresh();
    }
  }

  /**
   * Stop data binding and restore the DOM status
   */

  function unbind(): void {
    // update status
    bound = false;
    // de-init all directives
    for (const directive of directives) {
      directive.unbind();
    }
  }

  /**
   * Clone the current view configuration and optinally the model
   */

  function clone(el: HTMLElement, obj?: object): IView {
    return buildView(el, obj || context, options);
  }

  /**
   * Returns true when the view is bound to the element
   */

  function isBound(): boolean {
    return bound;
  }

  // resolvers
  const resolveBinder: (name: string) => IBinder = mapCollection(options.binders, mapBinder);
  const resolveComponent: (name: string) => IComponent = mapCollection(options.components, mapComponent);
  const resolveFormatter: (name: string) => IFormatter = mapCollection(options.formatters, mapFormatter);

  // make observer from context utility
  const observe: MakeObserver = getObserverBuilder(context, isBound);

  // DOM attribute parser
  const parser: IAttributeParser = buildAttributeParser(options.prefix || "i-");

  // shortcut
  function parseExpressionUtility(expression: string): IObserver {
    return parseExpression(
      expression,
      parser,
      observe,
      resolveFormatter
    );
  }

  /**
   * Load the custom binders for the current node
   */

  function loadBinders(el: HTMLElement): void {
    for (let i = 0; i < el.attributes.length; i++) {
      const attr: Attr = el.attributes[i];

      // skip normal attributes
      if (!parser.match(attr.name)) {
        continue;
      }

      // build the observer for the target value
      const observer: IObserver = parseExpressionUtility(el.getAttribute(attr.name));

      // get the binding object
      const binding: IBinding = buildBinding(el, attr.name, observer);

      // resolve the binder name
      const binder: IBinder = resolveBinder(binding.directive);

      // create the directive
      const directive: IDirective = buildBinderDirective(binding, binder);

      // schedule directive refresh in value change
      observer.notify(directive.refresh);

      // save the directive
      directives.push(directive);
    }
  }

  /**
   * Build attribute binding
   */

  function buildBinding(el: HTMLElement, attrName: string, observer: IObserver): IBinding {
    return assign(
      {
        el,
        context,
        get(): any {
          return observer.get();
        },
        set(value: any): void {
          observer.set(value);
        }
      },
      parser.parse(el, attrName)
    );
  }

  /**
   * Load conditional directive
   */

  function loadConditionalDirective(el: HTMLElement, attrName: string): void {
    const observer: IObserver = parseExpressionUtility(el.getAttribute(attrName));
    const binding: IBinding = buildBinding(el, attrName, observer);
    const directive: IDirective = buildConditionalDirective({
      binding,
      view: clone
    });
    observer.notify(directive.refresh);
    directives.push(directive);
  }

  /**
   * Load a component
   */

  function loadComponent(node: HTMLElement): void {
    const observers: IObserver[] = [];
    const context: object = {};

    for (let i = 0; i < node.attributes.length; i++) {
      const attr: Attr = node.attributes[i];
      const observer: IObserver = parseExpressionUtility(attr.value);
      Object.defineProperty(context, attr.name, {
        enumerable: true,
        configurable: true,
        get(): void {
          return observer.get();
        },
        set(value: any): void {
          observer.set(value);
        }
      });
      observers.push(observer);
    }

    const directive: IDirective = buildComponentDirective({
      node,
      context,
      components: resolveComponent,
      view: clone
    });

    for (const observer of observers) {
      observer.notify(directive.refresh);
    }

    directives.push(directive);
  }

  /**
   * Parse a text node and create its directives
   */

  function injectTextNodes(node: Text): void {
    // IE11 fix, use parentNode instead of parentElement
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/parentElement
    const parent: HTMLElement = node.parentNode as HTMLElement;
    const matches = parseText(node.data, /{([^}]+)}/g);

    for (const match of matches) {
      if (match.type === "text") {
        parent.insertBefore(
          document.createTextNode(match.content),
          node
        );
      } else {
        const expression: string = match.content;
        const observer: IObserver = parseExpressionUtility(expression);

        const directive: IDirective = buildTextDirective(
          parent.insertBefore(
            document.createTextNode(`{ ${expression} }`),
            node
          ),
          observer
        );

        observer.notify(directive.refresh);

        directives.push(directive);
      }
    }

    parent.removeChild(node);
  }

  /**
   * Load and initialize a list directive
   */

  function loadListDirective(el: HTMLElement, attrName: string): void {
    const observer: IObserver = parseExpressionUtility(el.getAttribute(attrName));

    const binding: IBinding = buildBinding(el, attrName, observer);

    const directive: IDirective = buildListDirective({
      binding,
      view: clone
    });

    observer.notify(directive.refresh);

    directives.push(directive);
  }

  /**
   * Traverse DOM nodes and save bindings
   */

  function traverse(node: Node) {
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
          traverse(el.childNodes[i]);
        }
      }
    }
  }

  // parse DOM tree and start data-binding
  traverse(el);

  // return the view
  return {
    el,
    context,
    bind,
    refresh,
    unbind,
    clone,
    isBound
  };
}
