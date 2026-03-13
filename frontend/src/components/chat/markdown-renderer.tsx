import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useCallback, type ComponentPropsWithoutRef } from "react";

export function MarkdownRenderer({ content }: { content: string }) {
  const components = useCallback(
    () => ({
      a: (props: ComponentPropsWithoutRef<"a">) => (
        <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300" />
      ),
      table: (props: ComponentPropsWithoutRef<"table">) => (
        <div className="overflow-x-auto my-2">
          <table {...props} className="border-collapse border border-border text-sm w-full" />
        </div>
      ),
      th: (props: ComponentPropsWithoutRef<"th">) => (
        <th {...props} className="border border-border px-3 py-1.5 bg-muted text-left font-semibold" />
      ),
      td: (props: ComponentPropsWithoutRef<"td">) => (
        <td {...props} className="border border-border px-3 py-1.5" />
      ),
      pre: (props: ComponentPropsWithoutRef<"pre">) => (
        <pre {...props} className="bg-[#0d1117] rounded-md p-3 overflow-x-auto my-2 text-sm" />
      ),
      code: ({ className, children, ...rest }: ComponentPropsWithoutRef<"code"> & { inline?: boolean }) => {
        const isBlock = className?.startsWith("language-");
        if (isBlock) return <code className={className} {...rest}>{children}</code>;
        return (
          <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...rest}>
            {children}
          </code>
        );
      },
      p: (props: ComponentPropsWithoutRef<"p">) => <p {...props} className="mb-2 last:mb-0" />,
      ul: (props: ComponentPropsWithoutRef<"ul">) => <ul {...props} className="list-disc pl-5 mb-2" />,
      ol: (props: ComponentPropsWithoutRef<"ol">) => <ol {...props} className="list-decimal pl-5 mb-2" />,
      h1: (props: ComponentPropsWithoutRef<"h1">) => <h1 {...props} className="text-xl font-bold mt-3 mb-1" />,
      h2: (props: ComponentPropsWithoutRef<"h2">) => <h2 {...props} className="text-lg font-bold mt-3 mb-1" />,
      h3: (props: ComponentPropsWithoutRef<"h3">) => <h3 {...props} className="text-base font-semibold mt-2 mb-1" />,
    }),
    []
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={components()}
    >
      {content}
    </ReactMarkdown>
  );
}
