import { Application } from "../interfaces/Application";
import { Attribute } from "../interfaces/Attribute";
import { Context } from "../interfaces/Context";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

import { buildContext } from "../context/context";

import { insertAfter, parentElement, replaceNode } from "../utils/dom";
import { isArray, isObject } from "../utils/language";

/**
 * List entry
 */
interface Entry {
  index?: number;
  key?: string;
  value: any;
}

/**
 * Map directive data into entries array
 */
function buildEntries(data: any): Entry[] {
  if (isArray(data)) {
    return data.map((value, index) => ({ index, value }));
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
  app: Application,
  argument: string,
  { index, key, value }: Entry
): Context {
  const context = buildContext(app.context, ["$index", "$key", argument]);

  context.$index = index;
  context.$key = key;
  context[argument] = value;

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
  app: Application,
  el: HTMLElement,
  attribute: Attribute
): Directive {
  // Extract useful data from app
  const { buildView } = app;
  const { expression } = attribute;

  // Ensure argument value
  const argument = attribute.argument || "$value";

  // Currently rendered views
  const views: View[] = [];

  // Static element into DOM to use as position marker
  const marker = document.createComment(` EACH ${expression.target.value} `);

  // Swap original element with maker
  replaceNode(marker, el);

  // Remove original DOM attribute
  el.removeAttribute(attribute.name);

  function update(data: any) {
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
  }

  function unbind() {
    // Remove rendered views
    unload(views);

    // Restore original attribute value
    el.setAttribute(attribute.name, attribute.value);

    // Restore original element
    replaceNode(el, marker);
  }

  // Return build directive
  return {
    expression,
    update,
    unbind
  };
}
