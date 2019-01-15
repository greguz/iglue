import { Directive } from "../interfaces/Directive";

import { noop } from "../utils";

export function getTextDirective(node: Text): Directive {
  return {
    refresh(value: any): void {
      node.data = value === undefined || value === null ? "" : value.toString();
    },
    unbind: noop
  };
}
