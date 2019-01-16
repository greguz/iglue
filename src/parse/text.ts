import { Chunk } from "../interfaces/Chunk";

export function parseText(text: string, regex: RegExp): Chunk[] {
  // Ensure global flag
  if (!regex.global) {
    throw new Error("The interpolation regular expression must be global");
  }

  // Results
  const chunks: Chunk[] = [];

  // Current match
  let match: RegExpExecArray | null;

  // Current text index
  let index: number = 0;

  // tslint:disable-next-line
  while ((match = regex.exec(text))) {
    // Extract previous text
    if (index !== match.index) {
      chunks.push({
        type: "static",
        from: index,
        to: match.index - 1,
        content: text.substring(index, match.index)
      });
    }

    // Extract matched path
    chunks.push({
      type: "expression",
      from: match.index,
      to: match.index + match[0].length - 1,
      content: match[1]
    });

    // Update current index
    index = match.index + match[0].length;
  }

  // Extract text after last match
  if (index !== text.length) {
    chunks.push({
      type: "static",
      from: index,
      to: text.length - 1,
      content: text.substring(index, text.length)
    });
  }

  return chunks;
}
