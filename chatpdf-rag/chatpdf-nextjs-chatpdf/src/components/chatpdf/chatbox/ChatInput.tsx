"use client";

import React, { memo } from "react";
import { Loader2, SendHorizonal } from "lucide-react";
import { cn } from "@/lib/utils";
import UploadFileButton from "./UploadFileButton";

type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  loading: boolean;
  pdfId: string;
};

const ChatInput = memo(
  ({ input, setInput, sendMessage, loading, pdfId }: ChatInputProps) => {
    return (
      <div className=" bg-slate-50 px-60 py-4">
        {
          !pdfId && (
            <div className="bg-red-100 rounded-sm mb-2 p-4">
          Select a pdf to Start Chatting
        </div>
          )
        }
        {pdfId}
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
            placeholder="Ask assistant, use @ to mention PDFs or / to access saved prompts"
            className="w-full resize-none border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
          />

          <div className="mt-3 flex items-center justify-between">
            <UploadFileButton pdfId={pdfId} />
        
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition",
                input.trim()
                  ? "bg-indigo-500 hover:bg-indigo-600"
                  : "bg-indigo-300 cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <SendHorizonal className="h-4 w-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
);


export default ChatInput;
