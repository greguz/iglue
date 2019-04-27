import { Application } from "../interfaces/Application";
import { Directive } from "../interfaces/Directive";

import { parseAttributeValue } from "../parse/attribute";

import { isNil } from "../utils/language";

export function buildTextDirective(app: Application, node: Text): Directive {
  const originalContent = node.data;

  function update(value: any) {
    node.data = isNil(value) ? "" : value.toString();
  }

  function unbind() {
    node.data = originalContent;
  }

  return {
    ...parseAttributeValue(originalContent),
    update,
    unbind
  };
}
