import { AttributeInfo } from "../interfaces/AttributeInfo";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

export interface ConditionalDirectiveOptions {
  el: HTMLElement;
  info: AttributeInfo;
  buildView: (el: HTMLElement) => View;
}

export function buildConditionalDirective(options: ConditionalDirectiveOptions): Directive {
  // shortcut
  const info: AttributeInfo = options.info;

  // get the parent element
  const parent: HTMLElement = options.el.parentElement;

  // create a placeholder node
  const comment: Comment = document.createComment(` IF : ${info.attrValue} `);

  // current rendered node into DOM
  let node: Comment | HTMLElement = options.el;

  // current condition status
  let status: boolean;

  // current rendered view instance
  let view: View;

  // remove original binding attribute from DOM
  options.el.removeAttribute(info.attrName);

  /**
   * Swap the current rendered DOM node with another
   */

  function swap(update: Comment | HTMLElement): void {
    if (update !== node) {
      parent.replaceChild(update, node);
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
        swap(options.el);
        view = options.buildView(options.el);
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
    options.el.setAttribute(info.attrName, info.attrValue);
    swap(options.el);
  }

  // return the directive instance
  return {
    refresh,
    unbind
  };
}
