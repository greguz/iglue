import { Chunk } from "../interfaces/Chunk";

export function parseText(text: string): Chunk[] {
  const regex = /{([^}]+)}/g;
  const chunks: Chunk[] = [];

  let index = 0;
  let match = regex.exec(text);

  while (match) {
    if (index !== match.index) {
      chunks.push({
        type: "static",
        from: index,
        to: match.index - 1,
        content: text.substring(index, match.index)
      });
    }

    chunks.push({
      type: "expression",
      from: match.index,
      to: match.index + match[0].length - 1,
      content: match[1]
    });

    index = match.index + match[0].length;
    match = regex.exec(text);
  }

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
