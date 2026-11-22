"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders TrustForge's answers: tables, lists, headings, code.
 * Raw HTML in the text is not rendered (react-markdown's default), so answers can't inject markup.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {c}
            </a>
          ),
          table: ({ children: c }) => (
            <div className="md-table">
              <table>{c}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
