import { App } from "../interfaces/App";
import { Directive } from "../interfaces/Directive";

import { parseAttributeValue } from "../parse/attribute";

export function buildTextDirective(this: App, node: Text): Directive {
  // Save the original node's content
  const content = node.data;

  return {
    // Expression info
    ...parseAttributeValue(content),
    // Refresh node content
    update(this: App, value: any) {
      node.data = value === undefined || value === null ? "" : value.toString();
    },
    // Restore original content
    unbind(this: App) {
      node.data = content;
    }
  };
}
