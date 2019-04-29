export interface Chunk {
  type: "static" | "expression";
  from: number;
  to: number;
  content: string;
}
