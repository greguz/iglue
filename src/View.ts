import { IBinding } from "./interfaces/IBinding";
import { IDirective } from "./interfaces/IDirective";
import { IModel, IModelCallback } from "./interfaces/IModel";
import { IObserver } from "./interfaces/IObserver";

import { buildModel } from "./model";

import { Binder, BinderDirective } from "./directives/BinderDirective";
import { Component, ComponentDirective } from "./directives/ComponentDirective";
import { TextDirective } from "./directives/TextDirective";

export interface Collection<T> {
  [key: string]: T;
}

export interface ViewOptions {
  prefix?: string;
  binders?: Collection<Binder<any>>;
  components?: Collection<Component>;
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
  const regex = new RegExp(prefix + "-([^:]+)");
  if (regex.test(attrName)) {
    return attrName.match(regex)[1];
  } else {
    throw new Error('Invalid attribute');
  }
}

function buildBinding(el: HTMLElement, attributeName: string, prefix: string, model: IModel, callback: IModelCallback): IBinding {
  const attributeValue: string = el.getAttribute(attributeName);
  const name: string = extractBindingName(attributeName, prefix);
  const path: string = attributeValue;
  const arg: string = extractBindingArgument(attributeName);
  const observer: IObserver = model.observe(path, callback);

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
    observer,
    get,
    set
  };
}
















/**
 * Build the default binder
 */

function buildDefaultBinder(attrName: string): Binder<any> {
  return function bindAttributeValue(el: HTMLElement, value: any): void {
    if (value == null) {
      el.removeAttribute(attrName);
    } else {
      el.setAttribute(attrName, value.toString());
    }
  };
}

export class View {

  /**
   * Binders collection
   */

  public static binders: Collection<Binder<any>> = binders;

  /**
   * Binders collection
   */

  public static components: Collection<Component> = {};

  /**
   * Bound DOM element
   */

  public readonly el: HTMLElement;

  /**
   * Bound data
   */

  public readonly data: any;

  /**
   * View options
   */

  public readonly options: ViewOptions;

  /**
   * Binders collection
   */

  private binders: Collection<Binder<any>>;

  /**
   * Binders collection
   */

  private components: Collection<Component>;

  /**
   * View model instance
   */

  private model: IModel;

  /**
   * Parsed DOM-data links
   */

  private directives: IDirective[];

  /**
   * Attribute name regular expression
   */

  private prefix: RegExp;













  /**
   * Bound observers
   */

  private observers: IObserver[];

  /**
   * @constructor
   */

  constructor(el: HTMLElement, data: object, options?: ViewOptions) {
    this.el = el;
    this.data = data;
    this.options = options || {};

    this.directives = [];
    this.model = buildModel(data);
    this.binders = Object.assign({}, View.binders, this.options.binders);
    this.components = Object.assign({}, View.components, this.options.components);
    this.prefix = new RegExp("^" + (this.options.prefix || "wd") + "-(.+)$");

    this.traverse(el);
  }

  /**
   * Bind data and DOM
   */

  public bind() {
    for (const directive of this.directives) {
      directive.bind();
    }
    for (const observer of this.observers) {
      observer.watch();
    }
  }

  /**
   * Stop data binding and restore the DOM status
   */

  public unbind() {
    for (const observer of this.observers) {
      observer.ignore();
    }
    for (const directive of this.directives) {
      directive.unbind();
    }
  }

  /**
   * Refresh the DOM
   */

  public refresh() {
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

  private loadComponent(el: HTMLElement): void {

    function updateComponent() {


    }

    const context: any = {};

    for (let i = 0; i < el.attributes.length; i++) {

      const attr: Attr = el.attributes[i];

      const binding: IBinding = buildBinding(el, attr.name, '', this.model, updateComponent);

      this.observers.push(binding.observer);

    }

    // create the component directive
    this.directives.push(
      new ComponentDirective(
        el,
        context,
        this.options,
        function resolveComponentName(name: string): Component {
          const component = this.components[name];
          if (!component) {
            throw new Error(`Unable to load component "${name}"`);
          }
          return component;
        }
      )
    );
  }

  /**
   * Load the custom binders for the current node
   */

  private loadBinders(node: HTMLElement): void {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < node.attributes.length; i++) {
      const attr: Attr = node.attributes[i];

      const matches = attr.name.match(this.prefix);
      if (!matches) {
        continue;
      }

      const binderName: string = matches[1];

      this.directives.push(
        new BinderDirective(
          node,
          attr.name,
          this.binders[binderName] || buildDefaultBinder(binderName)
        )
      );
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

        this.directives.push(
          new TextDirective(
            parent.insertBefore(
              document.createTextNode(`{ ${path} }`),
              node
            ),
            path
          )
        );

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
