import { App } from "../interfaces/App";
import { Context } from "../interfaces/Context";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

import { buildContext } from "../context/context";
import { parseAttribute } from "../parse/attribute";

import {
  insertAfter,
  isArray,
  isNumber,
  isObject,
  isString,
  parentElement,
  replaceChild
} from "../utils";

/**
 * Represents single array entry
 */
interface Entry {
  key: number | string;
  value: any;
}

/**
 * Map directive data into entries array
 */
function buildEntries(data: any): Entry[] {
  if (isArray(data)) {
    return data.map((value, key) => ({ key, value }));
  } else if (isObject(data)) {
    const result: Entry[] = [];
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        result.push({ key, value: data[key] });
      }
    }
    return result;
  } else {
    return [];
  }
}

/**
 * Build entry context
 */
function buildEntryContext(
  this: App,
  argument: string,
  { key, value }: Entry
): Context {
  // Build new context from source context plus some special props
  const context = buildContext(this.context, [argument, "$key", "$index"]);

  // Set own properties
  context.$key = isString(key) ? key : null;
  context.$index = isNumber(key) ? key : null;
  context[argument] = value;

  // Return build context object
  return context;
}

/**
 * Unload views array
 */
function unload(views: View[]) {
  while (views.length > 0) {
    const view = views.pop() as View;
    view.unbind();
    parentElement(view.el).removeChild(view.el);
  }
}

/**
 * Build list directive
 */
export function buildListDirective(
  this: App,
  el: HTMLElement,
  attrName: string
): Directive {
  // Extract useful data from app
  const { prefix, buildView } = this;

  // Parse target attribute
  const info = parseAttribute(prefix, el, attrName);

  // Ensure argument value
  const argument = info.argument || "$value";

  // Currently rendered views
  const views: View[] = [];

  // Static element into DOM to use as position marker
  const marker = document.createComment(` EACH ${info.value.value} `);

  // Swap original element with maker
  replaceChild(marker, el);

  // Remove original DOM attribute
  el.removeAttribute(info.attrName);

  // Return build directive
  return {
    ...info,
    update(this: App, data: any) {
      // Remove rendered views
      unload(views);

      // Get current entries
      const entries = buildEntries(data);

      // Last inserted node
      let previous: Node = marker;

      // Insert all views
      for (const entry of entries) {
        const ee = el.cloneNode(true) as HTMLElement;
        const ec = buildEntryContext.call(this, argument, entry);

        insertAfter(ee, previous);
        views.push(buildView(ee, ec));

        previous = previous.nextSibling as Node;
      }
    },
    unbind(this: App) {
      // Remove rendered views
      unload(views);

      // Restore original attribute value
      el.setAttribute(info.attrName, info.attrValue);

      // Restore original element
      replaceChild(el, marker);
    }
  };
}
