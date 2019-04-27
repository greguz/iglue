export function parentElement(node: Node): HTMLElement {
  const parent = node.parentElement || node.parentNode;
  if (!parent || parent.nodeType !== 1) {
    throw new Error("Node has no parent");
  }
  return parent as HTMLElement;
}

export function getAttributes(el: HTMLElement): Attr[] {
  return Array.prototype.slice.call(el.attributes);
}

export function replaceNode<T extends Node>(newNode: T, oldNode: Node): T {
  parentElement(oldNode).replaceChild(newNode, oldNode);
  return newNode;
}

export function insertAfter<T extends Node>(newNode: T, oldNode: Node): T {
  parentElement(oldNode).insertBefore(newNode, oldNode.nextSibling);
  return newNode;
}
