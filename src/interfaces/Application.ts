import { Binder, BinderRoutine } from "./Binder";
import { Component } from "./Component";
import { Context } from "./Context";
import { Formatter, FormatterFunction } from "./Formatter";
import { View } from "./View";

import { Collection } from "../utils/type";

export interface Application {
  context: Context;
  binders: Collection<Binder | BinderRoutine>;
  formatters: Collection<Formatter | FormatterFunction>;
  components: Collection<Component>;
  buildView: (el: HTMLElement, obj?: object) => View;
}
