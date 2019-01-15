import { AttributeInfo } from "../interfaces/AttributeInfo";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

import { getParent } from "../utils";

export function buildConditionalDirective(
  el: HTMLElement,
  info: AttributeInfo,
  buildView: (el: HTMLElement) => View
): Directive {
  // Parent element
  const parent = getParent(el);

  // Comment node as placeholder
  const comment = document.createComment(` IF : ${info.attrValue} `);

  // Current rendered node into DOM
  let node: Comment | HTMLElement = el;

  // Current conditional status
  let status: boolean | undefined;

  // Current rendered view instance
  let view: View | undefined;

  // Remove original attribute from DOM
  el.removeAttribute(info.attrName);

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
    const condition = !!value;

    if (condition !== status) {
      if (view) {
        view.unbind();
        view = undefined;
      }

      if (condition) {
        swap(el);
        view = buildView(el);
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
    el.setAttribute(info.attrName, info.attrValue);
    swap(el);
  }

  // Return built directive
  return {
    refresh,
    unbind
  };
}
