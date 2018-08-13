import { Binding } from "../interfaces/Binding";
import { Context } from "../interfaces/Context";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

import { buildContext } from "../context/context";

export interface ListDirectiveOptions {
  binding: Binding;
  view: (el: HTMLElement, data: object) => View;
}

export function buildListDirective(options: ListDirectiveOptions): Directive {
  const binding: Binding = options.binding;
  const container: HTMLElement = binding.el.parentElement;
  const marker: Comment = document.createComment(` EACH ${binding.value.value} `);

  let views: View[] = [];

  binding.el.removeAttribute(binding.attrName);

  container.insertBefore(marker, binding.el);
  container.removeChild(binding.el);

  function clone(): HTMLElement {
    return binding.el.cloneNode(true) as HTMLElement;
  }

  function buildListContext(index: number, entry: any): Context {
    //
    const context: Context = buildContext(binding.context, [
      "$index",
      binding.argument
    ]);

    // define local property for entry index
    Object.defineProperty(context, "$index", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: index
    });

    // define local property for entry data
    Object.defineProperty(context, binding.argument, {
      enumerable: true,
      configurable: true,
      writable: true,
      value: entry
    });

    return context;
  }

  function sync(target: any, index: number, model: any): object {
    target.$index = index;
    target[binding.argument] = model;
    return target;
  }

  function refresh(models: any[]): void {
    models = models || [];

    while (views.length > models.length) {
      const view: View = views.pop();

      view.unbind();

      container.removeChild(view.el);
    }

    let previous: Node = marker;

    views = models.map((model: any, index: number): View => {
      let view: View = views[index];

      if (view) {
        sync(view.context, index, model);
      } else {
        const el: HTMLElement = clone();
        const data: Context = buildListContext(index, model);

        container.insertBefore(el, previous.nextSibling);

        view = options.view(el, data);
      }

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

    container.insertBefore(binding.el, marker);
    container.removeChild(marker);

    binding.el.setAttribute(binding.attrName, binding.attrValue);
  }

  return {
    refresh,
    unbind
  };
}
