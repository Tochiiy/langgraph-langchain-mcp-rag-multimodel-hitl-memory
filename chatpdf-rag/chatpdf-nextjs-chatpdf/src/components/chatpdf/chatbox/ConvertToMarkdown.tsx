

"use client"
import React, { memo, forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export const ConvertToMarkdown = memo(function MarkdownBubble({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, ...props }) => (
          <a
            {...props}
            className="underline underline-offset-2  mr-1"
            target="_blank"
            rel="noreferrer"
          />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside space-y-2 mb-5" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal " {...props} />
        ),
        li: ({ node, ...props }) => ( <li style={{ marginBottom: '7px' }} {...props} />),

        p: ({ node, ...props }) => <p className="mb-5" {...props} />,
        h1: ({ node, ...props }) => (
          <h1 style={{ marginBottom: '' }} className="text-xl font-bold mt-2 mb-2" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 style={{ marginBottom: '' }} className="text-lg font-semibold mt-2 mb-2" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 style={{ marginBottom: '' }} className="text-base  font-semibold mt-2 mb-2" {...props} />
        ),
        strong: ({ node, ...props }) => <strong  className="font-bold " {...props} />,
        code: ({ node, className, children, ...props }) => {
          const inline = !className;
          return inline ? (
            <code
              className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        pre: ({ node, ...props }) => (
          <pre className="p-3 rounded-lg overflow-x-auto bg-black/10 dark:bg-white/10" {...props} />
        ),


            // ====== Table Support ======
        table: ({ node, ...props }) => (
          <table className="table-auto border-collapse border border-gray-300 w-full mb-5" {...props} />
        ),
        thead: ({ node, ...props }) => (
          <thead className="bg-gray-200 dark:bg-gray-700" {...props} />
        ),
        tbody: ({ node, ...props }) => <tbody {...props} />,
        tr: ({ node, ...props }) => (
          <tr className="border-b border-gray-300 dark:border-gray-600" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="px-3 py-2 text-left font-semibold border border-gray-300 dark:border-gray-600" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="px-3 py-2 border border-gray-300 dark:border-gray-600" {...props} />
        ),

      }}
    >
      {text}
    </ReactMarkdown>
  );
});



