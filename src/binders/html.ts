export default function html(el: HTMLElement, value: string): void {
  el.innerHTML = value == null ? '' : value;
}
