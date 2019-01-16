import { AttributeInfo } from "../interfaces/AttributeInfo";
import { Context } from "../interfaces/Context";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

import { getContext } from "../context/context";
import { getParent, isArray, isNumber, isObject, isString } from "../utils";

export function getListDirective(
  getView: (obj: any, el: HTMLElement) => View,
  context: Context,
  el: HTMLElement,
  info: AttributeInfo
): Directive {
  // Parent element
  const parent = getParent(el);

  // Static element into DOM to use as position marker
  const marker = document.createComment(` EACH ${info.value.value} `);

  // Currentlty rendered views
  const views: View[] = [];

  // Remove original DOM attribute
  el.removeAttribute(info.attrName);

  // Insert marker element into DOM
  parent.insertBefore(marker, el);

  // Remove origianl element from DOM
  parent.removeChild(el);

  /**
   * Clone the source node element
   */
  function clone(): HTMLElement {
    return el.cloneNode(true) as HTMLElement;
  }

  /**
   * Build the context for a single list entry
   */
  function getListContext(entry: any, keyOrIndex: string | number): Context {
    const listContext = getContext(context, [
      info.argument as string,
      "$key",
      "$index"
    ]);

    listContext.$key = isString(keyOrIndex) ? keyOrIndex : null;
    listContext.$index = isNumber(keyOrIndex) ? keyOrIndex : null;
    listContext[info.argument as string] = entry;

    return listContext;
  }

  /**
   * Remove rendered views
   */
  function clean() {
    while (views.length > 0) {
      const view = views.pop() as View;
      view.unbind();
      parent.removeChild(view.el);
    }
  }

  /**
   * Directive#refresh
   */
  function refresh(data: any): void {
    clean();

    let previous: Node = marker;
    function next(entry: any, keyOrIndex: string | number): void {
      const el = clone();
      const ec = getListContext(entry, keyOrIndex);

      parent.insertBefore(el, previous.nextSibling);

      views.push(getView(ec, el));

      previous = previous.nextSibling as Node;
    }

    if (isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        next(data[i], i);
      }
    } else if (isObject(data)) {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          next(data[key], key);
        }
      }
    }
  }

  /**
   * Directive#unbind
   */
  function unbind(): void {
    // Remove rendered views
    clean();

    // Restore original attribute value
    el.setAttribute(info.attrName, info.attrValue);

    // Restore original element
    parent.insertBefore(el, marker);

    // Remove marker
    parent.removeChild(marker);
  }

  // Return build directive
  return {
    refresh,
    unbind
  };
}
