import { Directive } from '../Directive';

export class TextDirective implements Directive {

  public readonly path: string;

  private node: Text;

  constructor(node: Text, path: string) {
    this.node = node;
    this.path = path;
  }

  public bind(): void {
    // nothing to do
  }

  public write(value: string): void {
    this.node.data = value == null ? '' : value.toString();
  }

  public unbind(): void {
    this.node.data = `{ ${this.path} }`;
  }

}
