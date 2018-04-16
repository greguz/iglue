import { Directive } from "./Directive";

import { Model } from "./model/Model";

import { Binder, BinderDirective } from "./directives/BinderDirective";
import { Component, ComponentDirective } from "./directives/ComponentDirective";
import { TextDirective } from "./directives/TextDirective";

import binders from './binders';

export interface Collection<T> {
  [key: string]: T;
}

export interface ViewOptions {
  prefix?: string;
  binders?: Collection<Binder<any>>;
  components?: Collection<Component>;
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

  private model: Model;

  /**
   * Parsed DOM-data links
   */

  private directives: Directive[];

  /**
   * Attribute name regular expression
   */

  private prefix: RegExp;

  /**
   * @constructor
   */

  constructor(el: HTMLElement, data: any, options?: ViewOptions) {
    this.el = el;
    this.data = data;
    this.options = options || {};

    this.directives = [];
    this.model = new Model(data);
    this.binders = Object.assign({}, View.binders, this.options.binders);
    this.components = Object.assign({}, View.components, this.options.components);
    this.prefix = new RegExp("^" + (this.options.prefix || "wd") + "-(.+)$");

    this.traverse(el);
  }

  /**
   * Bind data and DOM
   */

  public bind() {
    const { model, directives } = this;

    for (const directive of directives) {
      // observed model path
      const path = directive.path;

      // initialize the directive passing the publish function
      directive.bind((value) => {
        // update the model on directive publishing
        model.set(path, value);
      });

      // start model observing
      model.observe(path, (value) => {
        // notify the directive that the model has changed
        directive.write(value);
      });

      // initialize the directive value
      directive.write(model.get(path));
    }
  }

  /**
   * Stop data binding
   */

  public unbind() {
    const { model, directives } = this;

    for (const directive of directives) {
      directive.unbind();
    }

    model.unobserve();
  }

  /**
   * Refresh the DOM
   */

  public refresh() {
    const { model, directives } = this;

    for (const directive of directives) {
      directive.write(model.get(directive.path));
    }
  }

  /**
   * Create a new view with the same data binding
   */

  public clone(el: HTMLElement): View {
    return new View(el, this.data);
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
    // create the component context
    const context: any = {};

    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < node.attributes.length; i++) {
      const attr: Attr = node.attributes[i];

      // component context update function
      function write(value: any): void {
        context[attr.name] = value;
      }

      // initialize the component context
      write(this.model.get(attr.value));

      // save the directive for this path
      this.directives.push({
        path: attr.value,
        bind: () => undefined,
        write,
        unbind: () => undefined
      });
    }

    // create the component directive
    this.directives.push(
      new ComponentDirective(
        node,
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
