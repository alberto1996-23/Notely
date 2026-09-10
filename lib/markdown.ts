import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export function renderMarkdown(body: string): string {
  const html = marked.parse(body, { async: false, gfm: true });
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "em", "del", "blockquote", "ul", "ol", "li", "pre", "code", "a", "table", "thead", "tbody", "tr", "th", "td"],
    allowedAttributes: { a: ["href", "title"], ol: ["start"] },
    allowedSchemes: ["https", "http", "mailto"],
    allowProtocolRelative: false,
  });
}
