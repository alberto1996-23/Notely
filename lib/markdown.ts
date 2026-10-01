import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

// Convert Markdown into sanitized HTML that is safe
// to pass into React's dangerouslySetInnerHTML.
export function renderMarkdown(body: string): string {
  // Convert the Markdown text into HTML.
  // GFM enables GitHub-style features such as tables
  // and strikethrough.
  const html = marked.parse(body, {
    async: false,
    gfm: true,
  });

  // Remove any HTML tags, attributes, or URL schemes
  // that the application does not explicitly allow.
  return sanitizeHtml(html, {
    // Only allow HTML elements needed for supported Markdown.
    allowedTags: [
      "p",
      "br",
      "hr",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "em",
      "del",
      "blockquote",
      "ul",
      "ol",
      "li",
      "pre",
      "code",
      "a",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],

    // Restrict which attributes may remain on allowed elements.
    allowedAttributes: {
      a: ["href", "title"],
      ol: ["start"],
    },

    // Only allow normal web links and email links.
    allowedSchemes: [
      "https",
      "http",
      "mailto",
    ],

    // Require URLs to include an explicit protocol.
    allowProtocolRelative: false,
  });
}
