import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";




async function encodeImageFromUrl(url){
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Invalid file url ')
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}


export const readImageTool = tool(
  async ({ imageUrl }) => {
    try {
      const apiKey = process.env.FIRE_WORKS_API_KEY;
      if (!apiKey) throw new Error("Missing FIRE_WORKS_API_KEY");

      // Detect source type
      const base64Image =  await encodeImageFromUrl(imageUrl)
     

      const model = new ChatFireworks({
        model:"accounts/fireworks/models/qwen3-vl-30b-a3b-thinking",
        temperature: 0.7,
        apiKey,
      });

      const message = new HumanMessage({
        content: [
          {
            type: "text",
            text:'Summarize the key elements in this image clearly and concisely.'
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
            },
          },
        ],
      });

      const response = await model.invoke([message]);


      return {
        success: true,
        summary: response?.content,
      }
    } catch (error) {
      console.error("❌ Image read error:", error);
      return {
        success: false,
        summary: "",
      };
    }
  },
  {
    name: "read_image",
    description:
      "Read and analyze an image (local path or URL) and return a text summary.",
    schema: z.object({
      imageUrl: z
        .string()
        .describe("image url provided by the user"),
     
    }),
  }
);

