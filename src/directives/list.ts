import { AttributeInfo } from "../interfaces/AttributeInfo";
import { Context } from "../interfaces/Context";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

import { buildContext } from "../context/context";

export interface ListDirectiveOptions {
  el: HTMLElement;
  info: AttributeInfo;
  context: Context;
  buildView: (el: HTMLElement, obj: object) => View;
}

export function buildListDirective(options: ListDirectiveOptions): Directive {
  const info: AttributeInfo = options.info;
  const container: HTMLElement = options.el.parentElement;
  const marker: Comment = document.createComment(` EACH ${info.value.value} `);

  let views: View[] = [];

  options.el.removeAttribute(info.attrName);

  container.insertBefore(marker, options.el);
  container.removeChild(options.el);

  function clone(): HTMLElement {
    return options.el.cloneNode(true) as HTMLElement;
  }

  function buildListContext(entry: any, keyOrIndex: string | number): Context {
    const context: Context = buildContext(options.context, [
      info.argument,
      "$key",
      "$index"
    ]);

    context.$key = typeof keyOrIndex === "string" ? keyOrIndex : null;
    context.$index = typeof keyOrIndex === "number" ? keyOrIndex : null;
    context[info.argument] = entry;

    return context;
  }

  function refresh(data: any): void {
    while (views.length > 0) {
      const view: View = views.pop();
      view.unbind();
      container.removeChild(view.el);
    }

    let previous: Node = marker;
    function next(entry: any, keyOrIndex: string | number): void {
      const el: HTMLElement = clone();
      const data: Context = buildListContext(entry, keyOrIndex);

      container.insertBefore(el, previous.nextSibling);

      views.push(options.buildView(el, data));

      previous = previous.nextSibling;
    }

    if (data instanceof Array) {
      for (let i = 0; i < data.length; i++) {
        next(data[i], i);
      }
    } else if (typeof data === "object" && data !== null) {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          next(data[key], key);
        }
      }
    }
  }

  function unbind(): void {
    while (views.length > 0) {
      const view: View = views.pop();
      view.unbind();
      container.removeChild(view.el);
    }

    container.insertBefore(options.el, marker);
    container.removeChild(marker);

    options.el.setAttribute(info.attrName, info.attrValue);
  }

  return {
    refresh,
    unbind
  };
}
