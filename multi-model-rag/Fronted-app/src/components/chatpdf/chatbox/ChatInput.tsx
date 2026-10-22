"use client";

import React, { memo } from "react";
import { Loader2 } from "lucide-react";

type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  loading: boolean;
};

const ChatInput = memo(
  ({ input, setInput, sendMessage, loading }: ChatInputProps) => {
    return (
      <div className="bg-slate-50 px-60 py-4">
        <div className="rounded-2xl border border-indigo-400 p-3 shadow-sm">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask assistant"
            className="w-full resize-none border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
          />

          {loading && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default ChatInput;