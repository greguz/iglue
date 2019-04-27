import { Binder, BinderRoutine } from "./Binder";
import { Component } from "./Component";
import { Context } from "./Context";
import { Formatter, FormatterFunction } from "./Formatter";

import { Collection } from "../utils/type";

export interface View {
  /**
   * Bound DOM element
   */
  el: HTMLElement;
  /**
   * Bound context
   */
  context: Context;
  /**
   * Re-render the entire UI (edge cases)
   */
  update: () => void;
  /**
   * Destroy the view and restore the original DOM content
   */
  unbind: () => void;
}

export interface ViewOptions {
  binders?: Collection<Binder | BinderRoutine>;
  components?: Collection<Component>;
  formatters?: Collection<Formatter | FormatterFunction>;
}
