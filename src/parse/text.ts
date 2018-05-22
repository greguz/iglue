export interface IParsedTextNode {
  type: "text" | "expression";
  from: number;
  to: number;
  content: string;
}

export function parseText(text: string, regex: RegExp): IParsedTextNode[] {
  // ensure global flag
  if (!regex.global) {
    throw new Error("The interpolation regular expression must be global");
  }

  // resulting array
  const matches: IParsedTextNode[] = [];

  // current match
  let match: RegExpExecArray;

  // current text index
  let index = 0;

  // each all regexp matches
  while (match = regex.exec(text)) {
    // extract previous text
    if (index !== match.index) {
      matches.push({
        type: "text",
        from: index,
        to: match.index - 1,
        content: text.substring(index, match.index)
      });
    }

    // extract matched path
    matches.push({
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
    matches.push({
      type: "text",
      from: index,
      to: text.length - 1,
      content: text.substring(index, text.length)
    });
  }

  return matches;
}
