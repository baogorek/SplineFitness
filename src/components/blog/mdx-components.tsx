import type { MDXComponents } from "mdx/types";
import { YouTube } from "./youtube";

export const mdxComponents: MDXComponents = {
  YouTube,
  h1: (props) => (
    <h1
      className="text-3xl font-bold mt-8 mb-4 text-foreground"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="text-2xl font-semibold mt-8 mb-3 text-foreground"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="text-xl font-semibold mt-6 mb-2 text-foreground"
      {...props}
    />
  ),
  p: (props) => (
    <p className="text-foreground/90 leading-relaxed mb-4" {...props} />
  ),
  a: (props) => (
    <a
      className="text-primary hover:underline underline-offset-4"
      {...props}
    />
  ),
  strong: (props) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  code: (props) => (
    <code
      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 text-sm"
      {...props}
    />
  ),
  ul: (props) => (
    <ul className="list-disc list-inside mb-4 space-y-1 text-foreground/90" {...props} />
  ),
  ol: (props) => (
    <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground/90" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-primary pl-4 italic my-4 text-foreground/80"
      {...props}
    />
  ),
  hr: (props) => <hr className="my-8 border-border" {...props} />,
  img: (props) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="rounded-lg my-6 w-full" alt="" {...props} />
  ),
};
