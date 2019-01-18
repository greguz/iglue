import { App } from "../interfaces/App";
import { Directive } from "../interfaces/Directive";

import { parseAttributeValue } from "../parse/attribute";

import { noop } from "../utils";

export function buildTextDirective(this: App, node: Text): Directive {
  return {
    // Expression info
    ...parseAttributeValue(node.data),
    // Refresh node content
    update(this: App, value: any) {
      node.data = value === undefined || value === null ? "" : value.toString();
    },
    // Nothing to do on unbind
    unbind: noop
  };
}
