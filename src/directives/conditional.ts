import { Binding } from "../interfaces/Binding";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

export interface ConditionalDirectiveOptions {
  binding: Binding;
  view: (el: HTMLElement) => View;
}

export function buildConditionalDirective(options: ConditionalDirectiveOptions): Directive {
  // shortcut
  const binding: Binding = options.binding;

  // get the parent element
  const container: HTMLElement = binding.el.parentElement;

  // create a placeholder node
  const comment: Comment = document.createComment(` IF : ${binding.attrValue} `);

  // current rendered node into DOM
  let node: Comment | HTMLElement = binding.el;

  // current condition status
  let status: boolean;

  // current rendered view instance
  let view: View;

  // remove original binding attribute from DOM
  binding.el.removeAttribute(binding.attrName);

  /**
   * Swap the current rendered DOM node with another
   */

  function swap(update: Comment | HTMLElement): void {
    if (update !== node) {
      container.replaceChild(update, node);
      node = update;
    }
  }

  /**
   * Directive#refresh
   */

  function refresh(value: any): void {
    const condition: boolean = !!value;

    if (condition !== status) {
      if (view) {
        view.unbind();
        view = undefined;
      }

      if (condition) {
        swap(binding.el);
        view = options.view(binding.el);
      } else {
        swap(comment);
      }

      status = condition;
    }
  }

  /**
   * Directive#unbind
   */

  function unbind(): void {
    if (view) {
      view.unbind();
      view = undefined;
    }
    binding.el.setAttribute(binding.attrName, binding.attrValue);
    swap(binding.el);
  }

  // return the directive instance
  return {
    refresh,
    unbind
  };
}
