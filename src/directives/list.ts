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

  function buildListContext(index: number, entry: any): Context {
    const context: Context = buildContext(options.context, [
      "$index",
      info.argument
    ]);

    // define local property for entry index
    Object.defineProperty(context, "$index", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: index
    });

    // define local property for entry data
    Object.defineProperty(context, info.argument, {
      enumerable: true,
      configurable: true,
      writable: true,
      value: entry
    });

    return context;
  }

  function refresh(models: any[]): void {
    models = models || [];

    for (const view of views) {
      view.unbind();
      container.removeChild(view.el);
    }

    let previous: Node = marker;

    views = models.map((model: any, index: number): View => {
      const el: HTMLElement = clone();
      const data: Context = buildListContext(index, model);

      container.insertBefore(el, previous.nextSibling);

      const view: View = options.buildView(el, data);

      previous = previous.nextSibling;

      return view;
    });
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
