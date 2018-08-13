import { Directive } from "../interfaces/Directive";

export function buildTextDirective(node: Text): Directive {
  return {
    refresh(value: any): void {
      node.data = value === undefined || value === null
        ? ""
        : value.toString();
    },
    unbind(): void {
      // keep the last value
    }
  };
}
