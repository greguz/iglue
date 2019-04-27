import { Component } from "./interfaces/Component";
import { View, ViewOptions } from "./interfaces/View";

import { binders } from "./binders";
import { formatters } from "./formatters";

import { buildView } from "./view";

import { assign } from "./utils/language";
import { Collection } from "./utils/type";

export * from "./interfaces/Attribute";
export * from "./interfaces/Binder";
export * from "./interfaces/Binding";
export * from "./interfaces/Component";
export * from "./interfaces/Context";
export * from "./interfaces/Expression";
export * from "./interfaces/Formatter";
export * from "./interfaces/Specification";
export * from "./interfaces/View";

export * from "./context";

export * from "./utils/type";

export { binders, formatters };

export const components: Collection<Component> = {};

export function bind(
  el: HTMLElement,
  obj: object = {},
  options: ViewOptions = {}
): View {
  return buildView(
    el,
    obj,
    assign({}, binders, options.binders),
    assign({}, components, options.components),
    assign({}, formatters, options.formatters)
  );
}
