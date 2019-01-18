import { App } from "./App";
import { AttributeValueInfo } from "./AttributeInfo";

/**
 * Represents a chunk of UI
 */
export interface Directive extends AttributeValueInfo {
  /**
   * Fired every time there's a value update
   */
  update(this: App, value: any): void;

  /**
   * Fired during view unbind
   */
  unbind(this: App): void;
}
