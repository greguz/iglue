import { Application } from "../interfaces/Application";
import { Attribute } from "../interfaces/Attribute";
import { Directive } from "../interfaces/Directive";
import { View } from "../interfaces/View";

import { replaceNode } from "../utils/dom";

export function buildConditionalDirective(
  app: Application,
  el: HTMLElement,
  attribute: Attribute
): Directive {
  const { buildView } = app;
  const { expression } = attribute;
  const comment = document.createComment(` IF : ${attribute.value} `);

  let node: Node = el;
  let status: boolean | undefined;
  let view: View | undefined;

  el.removeAttribute(attribute.name);

  function update(value: any) {
    const newStatus = !!value;

    if (newStatus !== status) {
      if (view) {
        view.unbind();
      }

      status = newStatus;
      node = replaceNode(status ? el : comment, node);
      view = status ? buildView(el) : undefined;
    }
  }

  function unbind() {
    if (view) {
      view.unbind();
    }

    el.setAttribute(attribute.name, attribute.value);
    replaceNode(node, el);
  }

  return {
    expression,
    update,
    unbind
  };
}
