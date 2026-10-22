import fs from "fs";
import path from "path";
import { tool } from "@langchain/core/tools";
import { z } from "zod";


const ROOT = process.cwd();
const MEMORY_DIR = path.join(ROOT, "public", "chat-history");

if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

const HISTORY_FILE = path.join(MEMORY_DIR, "chat-history.json");

type ChatMsg = {
  role: "user" | "ai" | string;
  pdfId: string;
  projectId: string;
  content?: string;
  type?: string;
  chartType?: string;
  data?: any;
  createdAt?: number;
};


export function getLast10MessagesJson(params: { projectId: string; pdfId: string }) {
  const { projectId, pdfId } = params;

  if (!projectId || !pdfId) throw new Error("projectId and pdfId are required.");

  if (!fs.existsSync(HISTORY_FILE)) return [];

  const raw = fs.readFileSync(HISTORY_FILE, "utf-8").trim();
  if (!raw) return [];

  let all: ChatMsg[] = [];
  try {
    const parsed = JSON.parse(raw);
    all = Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }

  const last10 = all
    .filter((m) => m?.projectId === projectId && m?.pdfId === pdfId)
    .slice(-10)
    .map((m) => ({
      role: m.role,
      content: m.content ?? "",
    }));

  return JSON.stringify(last10);
}


export const messageSchema = z.object({
  role: z.enum(["user", "ai"]),
  pdfId: z.string(),
  content: z.string(),
  thinking: z.string().optional(),

  // Optional chart fields
  // type: z.literal("chart").optional(),
  // chartType: z.enum(["pie", "line"]).optional(),
  // data: z
  //   .array(
  //     z.object({
  //       name: z.string(),
  //       value: z.number(),
  //     })
  //   )
  //   .optional(),
});
export const writeToChatHistoryTool = tool(
  async ({ messages }) => {
    try {
      let history: any[] = [];

      // Load old history if exists
      if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, "utf-8");
        history = JSON.parse(data);
      }

      // Add new messages
      history.push(...messages);

      // Save updated history
      fs.writeFileSync(
        HISTORY_FILE,
        JSON.stringify(history, null, 2),
        "utf-8"
      );

      return "Memory successfully written.";
    } catch (error) {
      console.error("❌ Memory write error:", error);
      return "Failed to write memory.";
    }
  },
  {
    name: "write_memory",
    description: "Write conversation memory entries into a persistent JSON file.",
    schema: z.object({
      messages: z.array(messageSchema),
    }),
  }
);




// --------------------------------------------------
// READ MEMORY TOOL
// --------------------------------------------------

export const readChatHistoryTool = tool(
  async ({ pdfId }) => {
    try {
      if (!fs.existsSync(HISTORY_FILE)) {
        return "[]";
      }

      // Read memory file
      const data = fs.readFileSync(HISTORY_FILE, "utf-8");
      const history = JSON.parse(data);

      // Filter
      const filtered = history.filter((item: any) => {
        if (pdfId) {
          return item.pdfId === pdfId 
        }
        return item.pdfId === pdfId;
      });

      return JSON.stringify(filtered);
    } catch (error) {
      console.error("❌ Memory read error:", error);
      return "[]";
    }
  },
  {
    name: "read_memory",
    description:
      "Retrieve stored memory entries for a given user (and optional note).",
    schema: z.object({
      pdfId: z.string(),
      // projectId: z.string().optional(),
    }),
  }
);
