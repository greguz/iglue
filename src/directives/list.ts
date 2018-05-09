import { IBinding } from "../interfaces/IBinding";
import { IDirective } from "../interfaces/IDirective";
import { IView } from "../interfaces/IView";

export interface IListDirectiveOptions {
  model: object;
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

  function sync(target: any, index: number, model: any): object {
    for (const key in options.model) {
      target[key] = (options.model as any)[key];
    }
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
        sync(view.data, index, model);
      } else {
        const el: HTMLElement = clone();
        const data: object = sync({}, index, model);

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
