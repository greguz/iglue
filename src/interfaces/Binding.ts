import { Attribute } from "./Attribute";
import { Context } from "./Context";

import { Getter, Setter } from "../utils/type";

export interface Binding extends Attribute {
  /**
   * Bound context object
   */
  context: Context;
  /**
   * Get bound value
   */
  get: Getter;
  /**
   * Set bound value
   */
  set: Setter;
}
