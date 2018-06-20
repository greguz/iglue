/* tslint:disable */

/**
 * Always return false.
 */
const no = () => false;

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap(
  str: string,
  expectsLowerCase?: boolean
) {
  const map = Object.create(null);
  const list = str.split(',');
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? (val: string) => map[val.toLowerCase()]
    : (val: string) => map[val];
}

// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
const isNonPhrasingTag = makeMap(
  'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
  'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
  'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
  'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
  'title,tr,track'
);

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */

// Regular Expressions for parsing tags and attributes
const singleAttrIdentifier = /([^\s"'<>/=]+)/;
const singleAttrAssign = /(?:=)/;
const singleAttrValues = [
  // attr value double quotes
  /"([^"]*)"+/.source,
  // attr value, single quotes
  /'([^']*)'+/.source,
  // attr value, no quotes
  /([^\s"'=<>`]+)/.source
];
const attribute = new RegExp(
  '^\\s*' + singleAttrIdentifier.source +
  '(?:\\s*(' + singleAttrAssign.source + ')' +
  '\\s*(?:' + singleAttrValues.join('|') + '))?'
);

// could use https://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-QName
// but for Vue templates we can enforce a simple charset
const ncname = '[a-zA-Z_][\\w\\-\\.]*';
const qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')';
const startTagOpen = new RegExp('^<' + qnameCapture);
const startTagClose = /^\s*(\/?)>/;
const endTag = new RegExp('^<\\/' + qnameCapture + '[^>]*>');
const doctype = /^<!DOCTYPE [^>]+>/i;
const comment = /^<!--/;
const conditionalComment = /^<!\[/;

let IS_REGEX_CAPTURING_BROKEN = false;
'x'.replace(/x(.)?/g, function (m, g): any { IS_REGEX_CAPTURING_BROKEN = g === '' });

// Special Elements (can contain anything)
const isPlainTextElement = makeMap('script,style,textarea', true);
const reCache: any = {};

const decodingMap: any = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n'
};
const encodedAttr = /&(?:lt|gt|quot|amp);/g;
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10);/g;

function decodeAttr(value: string, shouldDecodeNewlines?: boolean) {
  const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
  return value.replace(re, match => decodingMap[match]);
}

export interface IParsedAttribute {
  name: string;
  value: string;
}

export interface IParserHandler {
  chars?: (chars: string) => void;
  warn?: (message: string) => void;
  start?: (tagName: string, attributes: IParsedAttribute[], unary: boolean, from: number, to: number) => void;
  end?: (tagName: string, from: number, to: number) => void;
}

export interface IParseHTMLOptions extends IParserHandler {
  expectHTML?: boolean;
  isUnaryTag?: (tagName: string) => boolean;
  canBeLeftOpenTag?: (tagName: string) => boolean;
  shouldDecodeNewlines?: boolean;
}

export function parseHTML(html: string, options: IParseHTMLOptions): void {
  const stack: any[] = [];
  const expectHTML = options.expectHTML;
  const isUnaryTag = options.isUnaryTag || no;
  const canBeLeftOpenTag = options.canBeLeftOpenTag || no;
  let index = 0;
  let last, lastTag: any;
  while (html) {
    last = html;
    // Make sure we're not in a plaintext content element like script/style
    if (!lastTag || !isPlainTextElement(lastTag)) {
      let textEnd = html.indexOf('<');
      if (textEnd === 0) {
        // Comment:
        if (comment.test(html)) {
          const commentEnd = html.indexOf('-->');

          if (commentEnd >= 0) {
            advance(commentEnd + 3);
            continue;
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (conditionalComment.test(html)) {
          const conditionalEnd = html.indexOf(']>');

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2);
            continue;
          }
        }

        // Doctype:
        const doctypeMatch = html.match(doctype);
        if (doctypeMatch) {
          advance(doctypeMatch[0].length);
          continue;
        }

        // End tag:
        const endTagMatch = html.match(endTag);
        if (endTagMatch) {
          const curIndex = index;
          advance(endTagMatch[0].length);
          parseEndTag(endTagMatch[1], curIndex, index);
          continue;
        }

        // Start tag:
        const startTagMatch = parseStartTag();
        if (startTagMatch) {
          handleStartTag(startTagMatch);
          continue;
        }
      }

      let text, rest, next;
      if (textEnd >= 0) {
        rest = html.slice(textEnd);
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text
          next = rest.indexOf('<', 1);
          if (next < 0) break;
          textEnd += next;
          rest = html.slice(textEnd);
        }
        text = html.substring(0, textEnd);
        advance(textEnd);
      }

      if (textEnd < 0) {
        text = html;
        html = '';
      }

      if (options.chars && text) {
        options.chars(text);
      }
    } else {
      var stackedTag = lastTag.toLowerCase();
      var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
      var endTagLength = 0;
      var rest = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length;
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          text = text
            .replace(/<!--([\s\S]*?)-->/g, '$1')
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
        }
        if (options.chars) {
          options.chars(text);
        }
        return '';
      })
      index += html.length - rest.length;
      html = rest;
      parseEndTag(stackedTag, index - endTagLength, index);
    }

    if (html === last) {
      options.chars && options.chars(html);
      if (/* process.env.NODE_ENV !== 'production' && */ !stack.length && options.warn) {
        options.warn(`Mal-formatted tag at end of template: "${html}"`);
      }
      break;
    }
  }

  // Clean up any remaining tags
  parseEndTag();

  function advance(n: number) {
    index += n;
    html = html.substring(n);
  }

  function parseStartTag() {
    const start = html.match(startTagOpen);
    if (start) {
      const match: any = {
        tagName: start[1],
        attrs: [],
        start: index
      };
      advance(start[0].length)
      let end, attr;
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length);
        match.attrs.push(attr);
      }
      if (end) {
        (match as any).unarySlash = end[1];
        advance(end[0].length);
        (match as any).end = index;
        return match;
      }
    }
  }

  function handleStartTag(match: any) {
    const tagName = match.tagName;
    const unarySlash = match.unarySlash;

    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag);
      }
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag(tagName);
      }
    }

    const unary = isUnaryTag(tagName) || tagName === 'html' && lastTag === 'head' || !!unarySlash;

    const l = match.attrs.length;
    const attrs = new Array(l);
    for (let i = 0; i < l; i++) {
      const args = match.attrs[i];
      // hackish work around FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=369778
      if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
        if (args[3] === '') { delete args[3]; }
        if (args[4] === '') { delete args[4]; }
        if (args[5] === '') { delete args[5]; }
      }
      const value = args[3] || args[4] || args[5] || '';
      attrs[i] = {
        name: args[1],
        value: decodeAttr(
          value,
          options.shouldDecodeNewlines
        )
      };
    }

    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs });
      lastTag = tagName;
    }

    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end);
    }
  }

  function parseEndTag(tagName?: string, start?: number, end?: number): void {
    let pos, lowerCasedTagName;
    if (start == null) start = index;
    if (end == null) end = index;

    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase();
    }

    // Find the closest opened tag of the same type
    if (tagName) {
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break;
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0;
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--) {
        if (/* process.env.NODE_ENV !== 'production' && */
          (i > pos || !tagName) &&
          options.warn
        ) {
          options.warn(
            `tag <${stack[i].tag}> has no matching end tag.`
          );
        }
        if (options.end) {
          options.end(stack[i].tag, start, end);
        }
      }

      // Remove the open elements from the stack
      stack.length = pos;
      lastTag = pos && stack[pos - 1].tag;
    } else if (lowerCasedTagName === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end);
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end);
      }
      if (options.end) {
        options.end(tagName, start, end);
      }
    }
  }
}

/**
 * Build a HTML template string into DOM nodes
 */

export function buildHTML(html: string): HTMLElement {
  let root: HTMLElement;
  let current: HTMLElement;

  parseHTML(html, {
    chars(text: string): void {
      text = text.replace(/\s+/g, ' ').trim();
      if (text) {
        if (!current) {
          throw new Error("Misplaced text node");
        }
        current.appendChild(document.createTextNode(text));
      }
    },
    start(tagName: string, attributes: IParsedAttribute[], unary: boolean): void {
      const el: HTMLElement = document.createElement(tagName);
      for (const attr of attributes) {
        el.setAttribute(attr.name, attr.value);
      }
      if (!root) {
        root = el;
      }
      if (current) {
        current.appendChild(el);
      }
      if (!unary) {
        current = el;
      }
    },
    end(): void {
      current = current.parentElement;
    },
    warn(message: string): void {
      throw new Error(message);
    }
  });

  return root;
}
