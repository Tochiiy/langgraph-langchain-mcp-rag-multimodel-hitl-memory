
export type ServerMessage = {
  role: "user" | "ai";
  content: string;
  thinking?:string
};

export type Message = {
  role: "user" | "assistant";
  text: string;
  time?: string;
};


export const fetchChatHistory = async (pdfId: string): Promise<Message[]> => {
  const res = await fetch(
    `http://localhost:8000/api/agent/chat-history?pdfId=${pdfId}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch chat history");
  }

  const data = await res.json();

  return data.messages.map((msg: ServerMessage) => ({
    role: msg.role === "ai" ? "assistant" : "user",
    text: msg.content,
    thinking:msg?.thinking
  }));
};
