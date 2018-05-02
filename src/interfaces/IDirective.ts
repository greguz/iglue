export interface IDirective {
  bind(): void;
  refresh(): void;
  unbind(): void;
}
