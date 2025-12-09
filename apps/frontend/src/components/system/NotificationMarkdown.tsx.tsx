import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Markdown = ReactMarkdown as unknown as React.FC<any>;

export const NotificationMarkdown = ({ content }: { content: string }) => (
  <div className="prose prose-sm prose-slate max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg">
    <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
  </div>
);
