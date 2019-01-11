/**
 * Represents a text chuck
 */

export interface Chunk {
  /**
   * Chunk type, static or expression
   */

  type: "static" | "expression";

  /**
   * Chunk start index
   */

  from: number;

  /**
   * Chunk end index
   */

  to: number;

  /**
   * Chunk content
   */

  content: string;
}
