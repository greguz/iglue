export default function hide(el: HTMLElement, value: boolean): void {
  el.style.display = value ? 'none' : '';
}
