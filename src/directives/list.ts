import { IBinding } from "../interfaces/IBinding";
import { IContext } from "../interfaces/IContext";
import { IDirective } from "../interfaces/IDirective";
import { IObserver, IObserverCallback } from "../interfaces/IObserver";
import { IView } from "../interfaces/IView";

import { observePath } from "../context/path";

export interface IListDirectiveOptions {
  binding: IBinding;
  view: (el: HTMLElement, data: object) => IView;
}

export function buildListDirective(options: IListDirectiveOptions): IDirective {
  const binding: IBinding = options.binding;
  const container: HTMLElement = binding.el.parentElement;
  const marker: Comment = document.createComment(` EACH ${binding.value.value} `);

  let views: IView[] = [];

  function clone(): HTMLElement {
    return binding.el.cloneNode(true) as HTMLElement;
  }

  function buildContext(index: number, entry: any): IContext {
    const context: IContext = binding.context.$clone();

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

    // extract the root observe function
    const originalObserve = context.$observe;

    // entry value path regex
    const entryRegExp = new RegExp('^' + binding.argument + '([\\.|\\[].*)?$');

    // inject the wrapped observe function
    Object.defineProperty(context, "$observe", {
      configurable: true,
      value: function observe(path: string, callback?: IObserverCallback): IObserver {
        if (path === "$index" || entryRegExp.test(path)) {
          return observePath(context, path, callback);
        } else {
          return originalObserve(path, callback);
        }
      }
    });

    return context;
  }

  function sync(target: any, index: number, model: any): object {
    target["$index"] = index;
    target[binding.argument] = model;
    return target;
  }

  function bind(): void {
    binding.el.removeAttribute(binding.attrName);

    container.insertBefore(marker, binding.el);
    container.removeChild(binding.el);
  }

  function refresh(): void {
    const models: any[] = binding.get() || [];

    while (views.length > models.length) {
      const view: IView = views.pop();

      view.unbind();

      container.removeChild(view.el);
    }

    let previous: Node = marker;

    views = models.map((model: any, index: number): IView => {
      let view: IView = views[index];

      if (view) {
        sync(view.context, index, model);
      } else {
        const el: HTMLElement = clone();
        const data: IContext = buildContext(index, model);

        container.insertBefore(el, previous.nextSibling);

        view = options.view(el, data);
        view.bind();
      }

      previous = previous.nextSibling;

      return view;
    });
  }

  function unbind(): void {
    while (views.length > 0) {
      const view: IView = views.pop();
      view.unbind();
      container.removeChild(view.el);
    }

    container.insertBefore(binding.el, marker);
    container.removeChild(marker);

    binding.el.setAttribute(binding.attrName, binding.attrValue);
  }

  return {
    bind,
    refresh,
    unbind
  };
}
