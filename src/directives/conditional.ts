import { App } from "../interfaces/App";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

import { parseAttribute } from "../parse/attribute";

import { replaceChild } from "../utils";

/**
 * Build conditional directive
 */
export function buildConditionalDirective(
  this: App,
  el: HTMLElement,
  attrName: string
): Directive {
  // Extract app data
  const { prefix, buildView } = this;

  // Parse attribute
  const info = parseAttribute(prefix, el, attrName);

  // Create marker element
  const comment = document.createComment(` IF : ${info.attrValue} `);

  // Current rendered node into DOM
  let node: Node = el;

  // Current conditional status
  let status: boolean | undefined;

  // Current rendered view instance
  let view: View | undefined;

  // Remove original attribute from DOM
  el.removeAttribute(info.attrName);

  // Return built directive
  return {
    ...info,
    update(this: App, value: any): void {
      // Enforce boolean type
      const condition = !!value;

      if (condition !== status) {
        // Destroy previous view if necessary
        if (view) {
          view.unbind();
        }

        // Swap current node with correct node
        node = replaceChild(condition ? el : comment, node);

        // Update currenct view status
        view = condition ? buildView(el) : undefined;

        // Update currenct condition status
        status = condition;
      }
    },
    unbind(this: App): void {
      // Clean current view
      if (view) {
        view.unbind();
      }

      // Restore original attribute value
      el.setAttribute(info.attrName, info.attrValue);

      // Restore original element
      replaceChild(node, el);
    }
  };
}
