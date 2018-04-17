import { IBinder, IBinderHook } from "./interfaces/IBinder";
import { IBinding } from "./interfaces/IBinding";
import { IComponent } from "./interfaces/IComponent";
import { IDirective } from "./interfaces/IDirective";
import { IModel } from "./interfaces/IModel";
import { IObserver } from "./interfaces/IObserver";

import { buildModel } from "./model";

import { BinderDirective } from "./directives/BinderDirective";
import { ComponentDirective } from "./directives/ComponentDirective";
import { TextDirective } from "./directives/TextDirective";

function extractBindingPath(attrValue: string): string {
  return attrValue;
}

function extractBindingArgument(attrName: string): string {
  const regex = /.+:(.+)$/;
  if (regex.test(attrName)) {
    return attrName.match(regex)[1];
  } else {
    return null;
  }
}

function extractBindingName(attrName: string, prefix: string): string {
  const regex = new RegExp(prefix + "([^:]+)");
  if (regex.test(attrName)) {
    return attrName.match(regex)[1];
  } else {
    throw new Error('Invalid attribute');
  }
}

function buildBinding(el: HTMLElement, attributeName: string, prefix: string, observer: IObserver): IBinding {
  const attributeValue: string = el.getAttribute(attributeName);
  const name: string = extractBindingName(attributeName, prefix);
  const path: string = extractBindingPath(attributeValue);
  const arg: string = extractBindingArgument(attributeName);

  function get(): any {
    return observer.get();
  }

  function set(value: any): void {
    observer.set(value);
  }

  return {
    el,
    attributeName,
    attributeValue,
    name,
    path,
    arg,
    get,
    set
  };
}

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

export interface Collection<T> {
  [key: string]: T;
}

export interface IViewOptions {
  prefix?: string;
  binders?: Collection<IBinder | IBinderHook>;
  components?: Collection<IComponent>;
}

export class View {

  /**
   * Bound DOM element
   */

  public readonly el: HTMLElement;

  /**
   * Bound data
   */

  public readonly data: any;

  /**
   * Binders prefix
   */

  private prefix: string;

  /**
   * Binders prefix
   */

  private prefixRegExp: RegExp;

  /**
   * Binders collection
   */

  private binders: Collection<IBinder | IBinderHook>;

  /**
   * Binders collection
   */

  private components: Collection<IComponent>;

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
   * @constructor
   */

  constructor(el: HTMLElement, data: object, options: IViewOptions = {}) {
    this.el = el;
    this.data = data;

    this.prefix = options.prefix || "wd-";
    this.prefixRegExp = new RegExp("^" + this.prefix + "(.+)$");

    this.binders = options.binders || {};
    this.components = options.components || {};

    this.model = buildModel(data);

    this.observers = [];
    this.directives = [];

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
      directive.routine();
    }
    // start values watching
    for (const observer of this.observers) {
      observer.watch();
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
      const observer: IObserver = this.model.observe(extractBindingPath(attr.value));
      observers.push(observer);
      bindings.push(buildBinding(node, attr.name, '', observer));
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

      const matches = attr.name.match(this.prefixRegExp);
      if (!matches) {
        continue;
      }

      const observer: IObserver = this.model.observe(extractBindingPath(attr.value));

      const binding: IBinding = buildBinding(node, attr.name, this.prefix, observer);

      const binderName: string = matches[1];

      const binder: IBinder | IBinderHook = this.binders[binderName] || buildDefaultBinder(binderName);

      const directive: IDirective = new BinderDirective(binding, binder);

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

}
