import { IAttributeParser, IAttributeInfo } from "./interfaces/IAttributeParser";
import { IBinder, IBinderHook } from "./interfaces/IBinder";
import { IBinding } from "./interfaces/IBinding";
import { ICollection } from "./interfaces/ICollection";
import { IComponent } from "./interfaces/IComponent";
import { IDirective } from "./interfaces/IDirective";
import { IModel } from "./interfaces/IModel";
import { IObserver } from "./interfaces/IObserver";
import { IView } from "./interfaces/IView";

import { buildModel } from "./model";
import { buildAttributeParser } from "./attributeParser";

import { buildBinderDirective } from "./directives/binder";
import { ComponentDirective } from "./directives/ComponentDirective";
import { TextDirective } from "./directives/TextDirective";

function buildDefaultBinder(attrName: string): IBinderHook {
  return function bindAttributeValue(binding: IBinding): void {
    const value: boolean = binding.get();
    if (value == null) {
      binding.el.removeAttribute(attrName);
    } else {
      binding.el.setAttribute(attrName, value.toString());
    }
  };
}

export interface IViewOptions {
  prefix?: string;
  binders?: ICollection<IBinder | IBinderHook>;
  components?: ICollection<IComponent>;
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

  private binders: ICollection<IBinder | IBinderHook>;

  /**
   * Binders collection
   */

  private components: ICollection<IComponent>;

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

    this.prefix = options.prefix || "wd-";
    this.observers = [];
    this.directives = [];
    this.bound = false;

    this.binders = options.binders || {};
    this.components = options.components || {};

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
        components: this.components
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
      const tag: string = node.nodeName.toLowerCase();

      // TODO rv-for

      // TODO rv-if

      if (tag === "component" || this.components[tag]) {
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
   * Load a component
   */

  private loadComponent(node: HTMLElement): void {
    const observers: IObserver[] = [];
    const bindings: IBinding[] = [];

    for (let i = 0; i < node.attributes.length; i++) {
      const attr: Attr = node.attributes[i];
      const info: IAttributeInfo = {
        attrName: attr.name,
        attrValue: attr.value,
        prefix: '',
        directive: attr.name,
        arg: null,
        modifiers: [],
        path: attr.value,
        formatter: null,
        args: []
      };
      const observer: IObserver = this.model.observe(info.path);
      observers.push(observer);
      bindings.push(this.buildBinding(node, info, observer));
    }

    const directive: IDirective = new ComponentDirective({
      node,
      bindings,
      components: (name: string): IComponent => {
        const component = this.components[name];
        if (component) {
          return component;
        } else {
          throw new Error(`Unable to find component "${name}"`);
        }
      },
      view: (el: HTMLElement, data: any): View => {
        return new View(el, data, {
          prefix: this.prefix,
          components: this.components,
          binders: this.binders
        });
      }
    });

    for (const observer of observers) {
      observer.bindTo(directive);
    }

    this.observers.push(...observers);
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

      const observer: IObserver = this.model.observe(info.path);

      const binding: IBinding = this.buildBinding(node, info, observer);

      const binder: IBinder | IBinderHook = this.binders[info.directive] || buildDefaultBinder(info.directive);

      const directive: IDirective = buildBinderDirective(binding, binder);

      observer.bindTo(directive);

      this.observers.push(observer);
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

        const directive: IDirective = new TextDirective(
          parent.insertBefore(
            document.createTextNode(`{ ${path} }`),
            node
          ),
          observer
        );

        observer.bindTo(directive);

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
   * Build attribute binding
   */

  private buildBinding(el: HTMLElement, info: IAttributeInfo, observer: IObserver): IBinding {
    // TODO formatter

    function get(): any {
      return observer.get();
    }

    function set(value: any): void {
      observer.set(value);
    }

    return Object.assign({ el, get, set }, info);
  }

}
