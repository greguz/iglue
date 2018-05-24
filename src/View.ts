import {
  IAttributeInfo,
  IAttributeParser,
  IAttributeValueInfo,
  IFormatterInfo,
  ITarget
} from "./interfaces/IAttributeParser";

import { IBinder, IBinderRoutine } from "./interfaces/IBinder";
import { IBinding } from "./interfaces/IBinding";
import { ICollection } from "./interfaces/ICollection";
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

function buildDefaultBinder(attrName: string): IBinderRoutine {
  return function bindAttributeValue(el: HTMLElement, value: any): void {
    if (value == null) {
      el.removeAttribute(attrName);
    } else {
      el.setAttribute(attrName, value.toString());
    }
  };
}

function wrapTarget(target: ITarget, context: IContext, callback?: IObserverCallback): IObserver {
  if (target.type === "path") {
    return context.$observe(target.value, callback);
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
  context: IContext,
  resolveFormatter: (name: string) => IFormatter,
  callback: IObserverCallback
): IFormatter[] {
  return infos.map((info: IFormatterInfo): IFormatter => {
    const formatter: IFormatter = resolveFormatter(info.name);

    const observers: IObserver[] = info.arguments.map(
      (target: ITarget): IObserver => wrapTarget(target, context, callback)
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

export class View<A extends object = {}> implements IView<A> {

  /**
   * Bound DOM element
   */

  public readonly el: HTMLElement;

  /**
   * View model instance
   */

  public readonly context: IContext<A>;

  /**
   * Binders collection
   */

  private binders: ICollection<IBinder | IBinderRoutine>;

  /**
   * Binders collection
   */

  private components: ICollection<IComponent>;

  /**
   * Formatters collection
   */

  private formatters: ICollection<Formatter | IFormatter>;

  /**
   * Parsed DOM-data links
   */

  private directives: IDirective[];

  /**
   * Binding status
   */

  private bound: boolean;

  /**
   * Attribute parser
   */

  private parser: IAttributeParser;

  /**
   * Configured directive prefix
   */

  private prefix: string;

  /**
   * @constructor
   */

  constructor(el: HTMLElement, obj: A, options: IViewOptions = {}) {
    this.el = el;

    if (obj.hasOwnProperty("$observe")) {
      this.context = obj as IContext<A>;
    } else {
      this.context = buildContext(obj);
    }

    this.prefix = options.prefix || "i-";
    this.directives = [];
    this.bound = false;

    this.binders = options.binders || {};
    this.components = options.components || {};
    this.formatters = options.formatters || {};

    this.parser = buildAttributeParser(this.prefix);

    this.traverse(el);
  }

  /**
   * Bind data and DOM
   */

  public bind() {
    // initialize directives
    for (const directive of this.directives) {
      directive.bind();
    }
    // call first routine
    for (const directive of this.directives) {
      directive.refresh();
    }
    // start data watching
    this.context.$start();
    // update status
    this.bound = true;
  }

  /**
   * Refresh the DOM
   */

  public refresh() {
    // call the routine for all directives
    for (const directive of this.directives) {
      directive.refresh();
    }
  }

  /**
   * Stop data binding and restore the DOM status
   */

  public unbind() {
    // stop data watching
    this.context.$stop();
    // de-init all directives
    for (const directive of this.directives) {
      directive.unbind();
    }
    // update status
    this.bound = false;
  }

  /**
   * Clone the current view configuration and optinally the model
   */

  public clone(el: HTMLElement): View<A>
  public clone<B extends object = {}>(el: HTMLElement, obj: B): View<B>
  public clone<B extends object = {}>(el: HTMLElement, obj?: B): View<A | B> {
    return new View(
      el,
      obj || this.context,
      {
        prefix: this.prefix,
        binders: this.binders,
        components: this.components,
        formatters: this.formatters
      }
    );
  }

  /**
   * Returns true when the view is bound to the element
   */

  public isBound(): boolean {
    return this.bound;
  }

  /**
   * Get a normalized formatter
   */

  private resolveFormatter(name: string): IFormatter {
    const formatter: Formatter | IFormatter = this.formatters[name];

    if (typeof formatter === "function") {
      return {
        pull: formatter,
        push: (value: any) => value
      };
    } else if (formatter) {
      return formatter;
    } else {
      throw new Error(`Formatter "${name}" not found`);
    }
  }

  /**
   * Get a normalized formatter
   */

  private resolveComponent(name: string): IComponent {
    const component: IComponent = this.components[name];

    if (component) {
      return component;
    } else {
      throw new Error(`Unable to find component "${name}"`);
    }
  }

  /**
   * Parse expression string
   */

  private parseExpression(expression: string): IObserver {
    // parse expression string
    const info: IAttributeValueInfo = this.parser.parseValue(expression);

    // root value observer
    const observer: IObserver = wrapTarget(info.value, this.context);

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
      this.context,
      this.resolveFormatter.bind(this),
      callback
    );

    // register watched paths
    for (const watchedPath of info.watch) {
      this.context.$observe(watchedPath).notify(callback);
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

  /**
   * Traverse DOM nodes and save bindings
   */

  private traverse(node: Node) {
    if (node.nodeType === 3) {
      this.injectTextNodes(node as Text);
    } else if (node.nodeType === 1) {
      const el: HTMLElement = node as HTMLElement;

      const eachAttr: string = this.parser.getAttributeByDirective(el, "each");
      const ifAttr: string = this.parser.getAttributeByDirective(el, "if");
      const cName: string = node.nodeName.toLowerCase();

      if (eachAttr) {
        this.loadListDirective(el, eachAttr);
      } else if (ifAttr) {
        this.loadConditionalDirective(el, ifAttr);
      } else if (cName === "component" || this.components[cName]) {
        this.loadComponent(el);
      } else {
        this.loadBinders(el);
        for (let i = 0; i < el.childNodes.length; i++) {
          this.traverse(el.childNodes[i]);
        }
      }
    }
  }

  /**
   * Load the custom binders for the current node
   */

  private loadBinders(el: HTMLElement): void {
    for (let i = 0; i < el.attributes.length; i++) {
      const attr: Attr = el.attributes[i];

      // skip normal attributes
      if (!this.parser.match(attr.name)) {
        continue;
      }

      // build the observer for the target value
      const observer: IObserver = this.parseExpression(el.getAttribute(attr.name));

      // get the binding object
      const binding: IBinding = this.buildBinding(el, attr.name, observer);

      // resolve the binder name
      const binder: IBinder | IBinderRoutine = this.binders[binding.directive] || buildDefaultBinder(binding.directive);

      // create the directive
      const directive: IDirective = buildBinderDirective(binding, binder);

      // schedule directive refresh in value change
      observer.notify(directive.refresh);

      // save the directive
      this.directives.push(directive);
    }
  }

  /**
   * Build attribute binding
   */

  private buildBinding(el: HTMLElement, attrName: string, observer: IObserver): IBinding {
    const info: IAttributeInfo = this.parser.parse(el, attrName);
    return {
      el,
      context: this.context,
      get(): any {
        return observer.get();
      },
      set(value: any): void {
        observer.set(value);
      },
      argument: info.argument,
      attrName: info.attrName,
      attrValue: info.attrValue,
      directive: info.directive,
      formatters: info.formatters,
      modifiers: info.modifiers,
      prefix: info.prefix,
      value: info.value,
      watch: info.watch
    };
  }

  /**
   * Load conditional directive
   */

  private loadConditionalDirective(el: HTMLElement, attrName: string): void {
    const observer: IObserver = this.parseExpression(el.getAttribute(attrName));
    const binding: IBinding = this.buildBinding(el, attrName, observer);
    const directive: IDirective = buildConditionalDirective({
      binding,
      view: this.clone.bind(this)
    });
    observer.notify(directive.refresh);
    this.directives.push(directive);
  }

  /**
   * Load a component
   */

  private loadComponent(node: HTMLElement): void {
    const observers: IObserver[] = [];
    const context: object = {};

    for (let i = 0; i < node.attributes.length; i++) {
      const attr: Attr = node.attributes[i];
      const observer: IObserver = this.parseExpression(attr.value);
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
      components: this.resolveComponent.bind(this),
      view: this.clone.bind(this)
    });

    for (const observer of observers) {
      observer.notify(directive.refresh);
    }

    this.directives.push(directive);
  }

  /**
   * Parse a text node and create its directives
   */

  private injectTextNodes(node: Text): void {
    const parent: HTMLElement = node.parentElement;
    const matches = parseText(node.data, /{([^}]+)}/g);

    for (const match of matches) {
      if (match.type === "text") {
        parent.insertBefore(
          document.createTextNode(match.content),
          node
        );
      } else {
        const expression: string = match.content;
        const observer: IObserver = this.parseExpression(expression);

        const directive: IDirective = buildTextDirective(
          parent.insertBefore(
            document.createTextNode(`{ ${expression} }`),
            node
          ),
          observer
        );

        observer.notify(directive.refresh);

        this.directives.push(directive);
      }
    }

    node.parentElement.removeChild(node);
  }

  /**
   * Load and initialize a list directive
   */

  private loadListDirective(el: HTMLElement, attrName: string): void {
    const observer: IObserver = this.parseExpression(el.getAttribute(attrName));

    const binding: IBinding = this.buildBinding(el, attrName, observer);

    const directive: IDirective = buildListDirective({
      binding,
      view: this.clone.bind(this)
    });

    observer.notify(directive.refresh);
    for (const key in this.context) {
      this.context.$observe(key).notify(directive.refresh);
    }

    this.directives.push(directive);
  }

}
