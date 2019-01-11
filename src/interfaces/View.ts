import { Collection } from "../utils";
import { Binder, BinderRoutine } from "./Binder";
import { Component } from "./Component";
import { Context } from "./Context";
import { Formatter, FormatterFunction } from "./Formatter";

/**
 * Represents a bound view
 */

export interface View {
  /**
   * Bound DOM element
   */

  readonly el: HTMLElement;

  /**
   * Bound data model
   */

  readonly context: Context;

  /**
   * Re-render the entire UI
   */

  refresh(): void;

  /**
   * Stop data binding and destroy the view
   */

  unbind(): void;
}

/**
 * Build a new view options
 */

export interface ViewOptions {
  /**
   * Global binders prefix
   */

  prefix?: string;

  /**
   * Binders collection
   */

  binders?: Collection<Binder | BinderRoutine>;

  /**
   * Components collection
   */

  components?: Collection<Component>;

  /**
   * Formatters collection
   */

  formatters?: Collection<Formatter | FormatterFunction>;
}
