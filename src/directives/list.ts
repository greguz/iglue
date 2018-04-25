import { IBinding } from "../interfaces/IBinding";
import { IDirective } from "../interfaces/IDirective";
import { IView } from "../interfaces/IView";

export interface IListDirectiveOptions {
  binding: IBinding;
  view: (el: HTMLElement, data: object) => IView;
}

export function buildListDirective(options: IListDirectiveOptions): IDirective {
  const binding: IBinding = options.binding;
  const container: HTMLElement = binding.el.parentElement;
  const marker: Comment = document.createComment(` EACH ${binding.path} `);

  let views: IView[] = [];

  function clone(): HTMLElement {
    return binding.el.cloneNode(true) as HTMLElement;
  }

  function bind(): void {
    binding.el.removeAttribute(binding.attrName);

    container.insertBefore(marker, binding.el);
    container.removeChild(binding.el);
  }

  function routine(): void {
    const models: any[] = binding.get() || [];

    while (views.length > models.length) {
      const view: IView = views.pop();

      view.unbind();

      container.removeChild(view.node);
    }

    let previous: Node = marker;

    views = models.map((model: any, index: number): IView => {
      let view: IView = views[index];

      if (view) {
        (view.data as any)['$index'] = index;
        (view.data as any)[binding.arg] = model;
      } else {
        const el = clone();
        const data: any = {
          ['$index']: index,
          [binding.arg]: model
        };

        container.insertBefore(el, previous.nextSibling);

        view = options.view(el, data);
        view.bind();
      }

      previous = view.node;

      return view;
    });

  }

  function unbind(): void {
    while (views.length > 0) {
      views.pop().unbind();
    }

    container.insertBefore(binding.el, marker);
    container.removeChild(marker);

    binding.el.setAttribute(binding.attrName, binding.attrValue);
  }

  return {
    bind,
    routine,
    unbind
  };
}
