

"use client";

import { memo, useEffect, useRef, useState } from "react";
import {

  ThumbsUp,
  ThumbsDown,

  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn, showError } from "@/lib/utils";
import ChatInput from "./chatbox/ChatInput";
import { ConvertToMarkdown } from "./chatbox/ConvertToMarkdown";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/stores";
import { addUserMessageWithAssistant, appendToAssistantThinking, appendToLastAssistant, fetchChatHistory, Message, setAssistantThinking } from "@/stores/chatSlice";



export default function ChatPanel({ pdfId }: { pdfId: string }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const typingRef = useRef(false);


  const thinkingQueueRef = useRef<string[]>([]);
  const thinkingTypingRef = useRef(false);




  const dispatch = useDispatch<AppDispatch>();
  const { messages, error, pdfId: selectedPdfId } = useSelector((state: RootState) => state.chat);

  useEffect(() => {
    dispatch(fetchChatHistory(selectedPdfId as string));
  }, [selectedPdfId, dispatch]);



  const typeNextThinking = () => {
    if (thinkingQueueRef.current.length === 0) {
      thinkingTypingRef.current = false;
      return;
    }

    thinkingTypingRef.current = true;
    const nextChar = thinkingQueueRef.current.shift()!;
    dispatch(appendToAssistantThinking(nextChar));

    setTimeout(typeNextThinking, 20); // usually faster than answer
  };





  /* ---------------- STREAM TYPING ---------------- */
  const typeNext = () => {
    if (queueRef.current.length === 0) {
      typingRef.current = false;
      return;
    }

    typingRef.current = true;
    const nextChar = queueRef.current.shift()!;
    dispatch(appendToLastAssistant(nextChar));


    setTimeout(typeNext, 30); // typing speed
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    dispatch(addUserMessageWithAssistant(userMessage));



    setInput("");
    setLoading(true);

    const eventSource = new EventSource(
      `/api/agent/stream?message=${encodeURIComponent(userMessage)}&pdfId=${selectedPdfId}`
    );

    eventSource.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      // server sends chunks in "message"
      queueRef.current.push(data.message);

      if (!typingRef.current) {
        typeNext();
      }
    });

    eventSource.addEventListener("thinking", (event) => {
      const data = JSON.parse(event.data);

      // push each character
      for (const char of data.thinking) {
        thinkingQueueRef.current.push(char);
      }

      if (!thinkingTypingRef.current) {
        typeNextThinking();
      }
    });


    eventSource.addEventListener("end", () => {
      setLoading(false);
      eventSource.close();
    });


    eventSource.addEventListener("error", () => {
      setLoading(false);
      eventSource.close();
      showError('Server Error')
    });

    eventSource.onerror = () => {
      setLoading(false);
      eventSource.close();
    };
  };



  /* ---------------- AUTO SCROLL ---------------- */
  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages, loading]);




  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // 2. Calculate if the user is near the bottom (within 100px)
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    // 3. Only auto-scroll if the user is already near the bottom
    //    or if the AI is just starting to load (force snap on new message)
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);


  return (
    <div className="flex h-full w-full flex-col bg-slate-50">

      {/* Messages area */}
      <div

        ref={scrollContainerRef}

        className="flex-1 overflow-y-auto px-60 py-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} loading={loading} />
        ))}


        <div ref={bottomRef} />
      </div>

      {/* Input (fixed bottom) */}
      <div className=" border-slate-200 bg-white">
        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          loading={loading}
          pdfId={pdfId || selectedPdfId}
        />
      </div>
    </div>
  );
}





const MessageBubble = memo(function MessageBubble({
  message,
  loading
}: {
  message: Message;
  loading: boolean
}) {
  const isUser = message.role === "user";
  const [showThinking, setShowThinking] = useState(false);

  return (
    <div
      className={cn(
        "flex group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm relative",
          isUser
            ? "bg-slate-200 text-gray-900 rounded-br-sm"
            : "bg-white text-slate-800 rounded-bl-sm border"
        )}
      >
        {!isUser && (
          <p className="mb-1 text-[11px] font-semibold text-slate-500">
            AI
          </p>
        )}

        {/* THINKING TOGGLE (AI only) */}


        {!isUser && message?.thinking && (
          <div className="mb-2">
            <button
              onClick={() => setShowThinking((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              {showThinking ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}

              {loading && showThinking && (
                <Loader2 size={12} className="ml-1 animate-spin text-slate-400" />
              )}
              Thinking

            </button>

            {showThinking && (
              <div className="mt-2 rounded-lg bg-slate-50 border px-3 py-2 text-xs text-slate-600 whitespace-pre-line">
                {message?.thinking}
              </div>
            )}
          </div>
        )}

        {/* MESSAGE CONTENT */}
        {isUser ? (
          <p className="whitespace-pre-line leading-relaxed">
            {message?.text}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none leading-relaxed">
            <ConvertToMarkdown text={message.text} />
          </div>
        )}
      </div>
    </div>
  );
});
