export default function text(el: HTMLElement, value: string): void {
  if (el.textContent) {
    el.textContent = value == null ? '' : value;
  } else {
    el.innerText = value == null ? '' : value;
  }
}
