import { Binder, BinderRoutine } from "./Binder";
import { Component } from "./Component";
import { Context } from "./Context";
import { Formatter, FormatterFunction } from "./Formatter";
import { View } from "./View";

import { Collection } from "../utils";

export interface App {
  binders: Collection<Binder | BinderRoutine>;
  components: Collection<Component>;
  context: Context;
  formatters: Collection<Formatter | FormatterFunction>;
  prefix: RegExp;
  buildView: (el: HTMLElement, obj?: any) => View;
}
