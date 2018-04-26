import {
  IAttributeInfo,
  IAttributeParser,
  IFormatterArgument,
  IFormatterPathArgument,
  IFormatterPrimitiveArgument
} from "./interfaces/IAttributeParser";

import { IBinder, IBinderRoutine } from "./interfaces/IBinder";
import { IBinding } from "./interfaces/IBinding";
import { ICollection } from "./interfaces/ICollection";
import { IComponent } from "./interfaces/IComponent";
import { IDirective } from "./interfaces/IDirective";
import { Formatter, IFormatter } from "./interfaces/IFormatter";
import { IModel } from "./interfaces/IModel";
import { IObserver } from "./interfaces/IObserver";
import { IView } from "./interfaces/IView";

import { buildAttributeParser } from "./attributeParser";
import { buildModel } from "./model";

import { buildBinderDirective } from "./directives/binder";
import { buildComponentDirective } from "./directives/component";
import { buildConditionalDirective } from "./directives/conditional";
import { buildListDirective } from "./directives/list";
import { buildTextDirective } from "./directives/text";

function buildDefaultBinder(attrName: string): IBinderRoutine {
  return function bindAttributeValue(value: any, binding: IBinding): void {
    if (value == null) {
      binding.el.removeAttribute(attrName);
    } else {
      binding.el.setAttribute(attrName, value.toString());
    }
  };
}

interface IParsedFormatterArgument {
  observer?: IObserver;
  get: () => any;
}

function parseFormatterPathArgument(arg: IFormatterPathArgument, model: IModel): IParsedFormatterArgument {
  const observer: IObserver = model.observe(arg.value);
  return {
    observer,
    get: () => observer.get()
  };
}

function parseFormatterPrimitiveArgument(arg: IFormatterPrimitiveArgument): IParsedFormatterArgument {
  return {
    get: () => arg.value
  };
}

function parseFormatterArgument(arg: IFormatterArgument, model: IModel) {
  if (arg.type === "path") {
    return parseFormatterPathArgument(arg, model);
  } else {
    return parseFormatterPrimitiveArgument(arg);
  }
}

export interface IViewOptions {
  prefix?: string;
  binders?: ICollection<IBinder | IBinderRoutine>;
  components?: ICollection<IComponent>;
  formatters?: ICollection<Formatter | IFormatter>;
}

export class View implements IView {

  /**
   * Bound DOM element
   */

  public readonly node: HTMLElement;

  /**
   * Bound data
   */

  public readonly data: any;

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
   * View model instance
   */

  private model: IModel;

  /**
   * Bound observers
   */

  private observers: IObserver[];

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

  constructor(node: HTMLElement, data: object, options: IViewOptions = {}) {
    this.node = node;
    this.data = data;

    this.prefix = options.prefix || "i-";
    this.observers = [];
    this.directives = [];
    this.bound = false;

    this.binders = options.binders || {};
    this.components = options.components || {};
    this.formatters = options.formatters || {};

    this.parser = buildAttributeParser(this.prefix);
    this.model = buildModel(data);

    this.traverse(node);
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
      directive.routine();
    }
    // start values watching
    for (const observer of this.observers) {
      observer.watch();
    }
    // update status
    this.bound = true;
  }

  /**
   * Refresh the DOM
   */

  public refresh() {
    // call the routine for all directives
    for (const directive of this.directives) {
      directive.routine();
    }
  }

  /**
   * Stop data binding and restore the DOM status
   */

  public unbind() {
    // stop values watching
    for (const observer of this.observers) {
      observer.ignore();
    }
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

  public clone(node: HTMLElement, data?: object): View {
    return new View(
      node,
      data || this.data,
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
   * Traverse DOM nodes and save bindings
   */

  private traverse(node: Node) {
    if (node.nodeType === 3) {
      this.injectTextNodes(node as Text);
    } else if (node.nodeType === 1) {
      const eachAttr: string = this.parser.getAttributeByDirective(node as HTMLElement, "each");
      const ifAttr: string = this.parser.getAttributeByDirective(node as HTMLElement, "if");
      const cName: string = node.nodeName.toLowerCase();

      if (eachAttr) {
        this.loadListDirective(node as HTMLElement, eachAttr);
      } else if (ifAttr) {
        const info: IAttributeInfo = this.parser.parse(node as HTMLElement, ifAttr);
        const binding: IBinding = this.buildBinding(node as HTMLElement, info);
        const directive: IDirective = buildConditionalDirective({
          binding,
          view: this.clone.bind(this)
        });

        for (const observer of binding.observers) {
          observer.notify(directive);
        }

        this.observers.push(...binding.observers);
        this.directives.push(directive);
      } else if (cName === "component" || this.components[cName]) {
        this.loadComponent(node as HTMLElement);
      } else {
        this.loadBinders(node as HTMLElement);

        for (const child of node.childNodes) {
          this.traverse(child as HTMLElement);
        }
      }
    }
  }

  /**
   * Load and initialize a list directive
   */

  private loadListDirective(node: HTMLElement, attrName: string): void {
    const info: IAttributeInfo = this.parser.parse(node, attrName);

    const binding: IBinding = this.buildBinding(node, info);

    const observers: IObserver[] = [
      ...binding.observers
    ];

    const directive: IDirective = buildListDirective({
      binding,
      view: this.clone.bind(this),
      model: this.data
    });

    for (const key in this.data) {
      observers.push(this.model.observe(key));
    }

    for (const observer of observers) {
      observer.notify(directive);
    }

    this.observers.push(...observers);
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
      const observer: IObserver = this.model.observe(attr.value);
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
      components: (name: string): IComponent => {
        const component = this.components[name];
        if (component) {
          return component;
        } else {
          throw new Error(`Unable to find component "${name}"`);
        }
      },
      view: this.clone.bind(this)
    });

    for (const observer of observers) {
      observer.notify(directive);
      this.observers.push(observer);
    }

    this.directives.push(directive);
  }

  /**
   * Load the custom binders for the current node
   */

  private loadBinders(node: HTMLElement): void {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr: Attr = node.attributes[i];

      if (!this.parser.match(attr.name)) {
        continue;
      }

      const info: IAttributeInfo = this.parser.parse(node, attr.name);

      const binding: IBinding = this.buildBinding(node, info);

      const binder: IBinder | IBinderRoutine = this.binders[info.directive] || buildDefaultBinder(info.directive);

      const directive: IDirective = buildBinderDirective(binding, binder);

      for (const observer of binding.observers) {
        observer.notify(directive);
        this.observers.push(observer);
      }

      this.directives.push(directive);
    }
  }

  /**
   * Parse a text node and create its directives
   */

  private injectTextNodes(node: Text): void {
    const parent: HTMLElement = node.parentElement;
    const text: string = node.data;
    let chunk: string = "";

    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < text.length; i++) {
      const char: string = text[i];

      if (char === "{") {
        if (chunk) {
          parent.insertBefore(
            document.createTextNode(chunk),
            node
          );
          chunk = "";
        }
      } else if (char === "}") {
        const path: string = chunk.trim();

        if (!path) {
          throw new Error("Invalid text binding");
        }

        const observer: IObserver = this.model.observe(path);

        const directive: IDirective = buildTextDirective(
          parent.insertBefore(
            document.createTextNode(`{ ${path} }`),
            node
          ),
          observer
        );

        observer.notify(directive);

        this.observers.push(observer);
        this.directives.push(directive);

        chunk = "";
      } else {
        chunk += char;
      }
    }

    if (chunk) {
      parent.insertBefore(
        document.createTextNode(chunk),
        node
      );
    }

    node.parentElement.removeChild(node);
  }

  /**
   * Get a normalized formatter
   */

  private resolveFormatter(name: string): IFormatter {
    const formatter: Formatter | IFormatter = this.formatters[name];

    if (typeof formatter === "function") {
      return {
        read: formatter,
        write: (value: any) => value
      };
    } else if (formatter) {
      return formatter;
    } else {
      return {
        read: (value: any) => value,
        write: (value: any) => value
      };
    }
  }

  /**
   * Build attribute binding
   */

  private buildBinding(el: HTMLElement, info: IAttributeInfo): IBinding {
    const observer: IObserver = this.model.observe(info.path);
    const formatter: IFormatter = this.resolveFormatter(info.formatter);
    const args: IParsedFormatterArgument[] = info.args.map(arg => parseFormatterArgument(arg, this.model));

    function values(): any[] {
      return args.map((arg) => arg.get());
    }

    function get(): any {
      return formatter.read(observer.get(), ...values());
    }

    function set(value: any): void {
      observer.set(formatter.write(value, ...values()));
    }

    const observers: IObserver[] = [observer];
    for (const arg of args) {
      if (arg.observer) {
        observers.push(arg.observer);
      }
    }

    return Object.assign({ el, observers, get, set }, info);
  }

}
