import { Target } from "./Target";

export interface Expression {
  target: Target;
  formatters: FormatterInfo[];
  watch: string[];
}

export interface FormatterInfo {
  name: string;
  targets: Target[];
}
