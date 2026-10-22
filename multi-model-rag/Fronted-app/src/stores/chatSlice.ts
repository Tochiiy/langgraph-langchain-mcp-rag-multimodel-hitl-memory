// store/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetchChatHistory as fetchChatHistoryFn } from "@/app/client/api/chat"; // <-- your existing function

// Types
export interface Message {
  role: "user" | "assistant";
  text: string;
  pdfId: string
  thinking?:string
}

interface ChatState {
  messages: Message[];
  pdfId:string | null;
  loading: boolean;
  error: string | null;
}
// Async thunk calling your fetchChatHistory function
export const fetchChatHistory = createAsyncThunk<Message[], string>(
  "chat/fetchHistory",
  async (pdfId: string) => {
    const messages = await fetchChatHistoryFn(pdfId);
    return messages;
  }
);


const initialState: ChatState = {
  messages: [],
  pdfId:null,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setPdfId(state, action: PayloadAction<string>) {
      state.pdfId = action.payload;
      state.messages = []; // optionally clear previous chat
    },
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
    },
    clearMessages(state) {
      state.messages = [];
    },

     /** 🔥 STREAMING ACTION */
    appendToLastAssistant(state, action: PayloadAction<string>) {
      const last = state.messages[state.messages.length - 1];

      if (last && last.role === "assistant") {
        last.text += action.payload; // Immer handles immutability
      }
    },

     addUserMessageWithAssistant(state, action: PayloadAction<string>) {
    state.messages.push(
      { role: "user", text: action.payload },
      { role: "assistant", text: "" , thinking: ""} // stream target
    );
  },


   /** 🧠 STREAM THINKING (overwrite, not typed) */
  setAssistantThinking(state, action: PayloadAction<string>) {
    const last = state.messages[state.messages.length - 1];

    if (last && last.role === "assistant") {
      last.thinking = action.payload;
    }
  },

  appendToAssistantThinking(state, action: PayloadAction<string>) {
  const last = state.messages[state.messages.length - 1];
  if (last && last.role === "assistant") {
    last.thinking = (last.thinking || "") + action.payload;
  }
}

  
  
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action: PayloadAction<Message[]>) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch chat history";
      });
  },
});

export const { addMessage,appendToLastAssistant,appendToAssistantThinking,setAssistantThinking, addUserMessageWithAssistant,clearMessages,setPdfId } = chatSlice.actions;
export default chatSlice.reducer;
