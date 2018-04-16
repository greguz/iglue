import { Model } from "./Model";
import { Directive } from "./Directive";

import { BinderDirective, Binder } from "./directives/BinderDirective";
import { ComponentDirective, Component } from "./directives/ComponentDirective";

export interface Collection<T> {
  [key: string]: T;
}

export interface ViewOptions {
  prefix?: string;
  binders?: Collection<Binder<any>>;
  components?: Collection<Component>;
}

export class View {

  /**
   * Binders collection
   */

  public static binders: Collection<Binder<any>> = {};

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
    Object.assign(this.binders, View.binders, this.options.binders);
    Object.assign(this.components, View.components, this.options.components);
    this.prefix = new RegExp("^" + (this.options.prefix || 'wd') + "-(.+)$");

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

      // initialize the directive value
      directive.write(model.get(path));

      // start model observing
      model.observe(path, () => {
        // notify the directive that the model has changed
        directive.write(model.get(path));
      });
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

  private traverse(node: HTMLElement) {
    if (node.nodeType === 3) {

      // TODO apply text binding

    } else if (node.nodeType === 1) {
      const tag: string = node.nodeName.toLowerCase()

      // TODO rv-for

      // TODO rv-if

      if (tag === "component" || this.components[tag]) {
        this.loadComponent(node);
      } else {
        this.loadBinders(node);

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

    // schedule the data reload for the context attributes
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
    for (let i = 0; i < node.attributes.length; i++) {
      const attr: Attr = node.attributes[i];

      const matches = attr.name.match(this.prefix);
      if (!matches) {
        continue;
      }

      this.directives.push(
        new BinderDirective(
          node,
          attr.name,
          this.binders[matches[1]]
        )
      );
    }
  }

}
