import { IBinding } from "../interfaces/IBinding";
import { IDirective } from "../interfaces/IDirective";
import { IView } from "../interfaces/IView";

export interface IConditionalDirectiveOptions {
  binding: IBinding;
  view: (el: HTMLElement) => IView;
}

export function buildConditionalDirective(options: IConditionalDirectiveOptions): IDirective {
  const container: HTMLElement = options.binding.el.parentElement;
  const comment: Comment = document.createComment(` IF : ${options.binding.path} `);
  let node: Comment | HTMLElement = options.binding.el;
  let status: boolean;
  let view: IView;

  function swap(update: Comment | HTMLElement): void {
    if (update !== node) {
      node = container.replaceChild(update, node);
    }
  }

  function bind(): void {
    options.binding.el.removeAttribute(options.binding.attrName);
  }

  function routine(): void {
    const condition: boolean = !!this.binding.get();

    if (condition !== status) {
      if (view) {
        view.unbind();
        view = undefined;
      }

      if (condition) {
        swap(options.binding.el);
        view = options.view(options.binding.el);
        view.bind();
      } else {
        swap(comment);
      }

      status = condition;
    }
  }

  function unbind(): void {
    if (view) {
      view.unbind();
      view = undefined;
    }
    swap(options.binding.el);
    options.binding.el.setAttribute(options.binding.attrName, options.binding.attrValue);
    status = undefined;
  }

  return {
    bind,
    routine,
    unbind
  };
}
