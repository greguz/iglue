import { Chunk } from "../interfaces/Chunk";

export function parseText(text: string, regex: RegExp): Chunk[] {
  // ensure global flag
  if (!regex.global) {
    throw new Error("The interpolation regular expression must be global");
  }

  // resulting array
  const chunks: Chunk[] = [];

  // current match
  let match: RegExpExecArray;

  // current text index
  let index: number = 0;

  // each all regexp matches
  while ((match = regex.exec(text))) {
    // extract previous text
    if (index !== match.index) {
      chunks.push({
        type: "static",
        from: index,
        to: match.index - 1,
        content: text.substring(index, match.index)
      });
    }

    // extract matched path
    chunks.push({
      type: "expression",
      from: match.index,
      to: match.index + match[0].length - 1,
      content: match[1]
    });

    // update current index
    index = match.index + match[0].length;
  }

  // extract text after last match
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
