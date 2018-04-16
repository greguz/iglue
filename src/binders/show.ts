export default function show(el: HTMLElement, value: boolean): void {
  el.style.display = value ? '' : 'none';
}
