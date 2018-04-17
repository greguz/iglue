export interface IDirective {
  bind(): void;
  routine(): void;
  unbind(): void;
}
