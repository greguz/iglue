import { IBinding } from "../interfaces/IBinding";
import { IDirective } from "../interfaces/IDirective";
import { IView } from "../interfaces/IView";

export interface IConditionalDirectiveOptions {
  binding: IBinding;
  view: (el: HTMLElement) => IView;
}

export class ConditionalDirective implements IDirective {

  private binding: IBinding;

  private view: IView;

  private parentNode: HTMLElement;
  private originalNode: HTMLElement;
  private commentNode: HTMLElement;
  private currentNode: HTMLElement | Comment;

  private status: boolean;

  constructor(options: IConditionalDirectiveOptions) {
    this.binding = options.binding;
    this.parentNode = options.binding.el.parentElement;
    this.visibleNode = options.binding.el;
    this.hiddenNode = document.createComment(` if ${this.binding.path} `);
  }

  public bind(): void {
    this.originalNode.removeAttribute(this.binding.attributeName);
  }

  public routine(): void {

    const value: boolean = !!this.binding.get();

    if (value !== this.status) {

      this.unbindCurrentView();

      if (value) {

        this.swapCurrentNode(this.originalNode);

        // show the original value without the if attribute

        this.view.bind();

      } else {

        this.swapCurrentNode(this.commentNode);

      }

      this.status = value;

    }

  }

  public unbind(): void {
    this.unbindCurrentView();
    this.originalNode.setAttribute(
      this.binding.attributeName,
      this.binding.attributeValue
    );
  }






  private unbindCurrentView() {
    if (this.view.isBound()) {
      this.view.unbind();
    }
  }

  private swapCurrentNode(node: HTMLElement | Comment) {
    this.parentNode.replaceChild(node, this.currentNode);
    this.currentNode = node;
  }

}
