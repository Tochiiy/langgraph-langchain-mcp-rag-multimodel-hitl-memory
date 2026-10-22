import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import { Document } from "@langchain/core/documents";

import z from "zod";

import { ChatCerebras } from "@langchain/cerebras";
import { SystemMessage } from "@langchain/core/messages";



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}




// ✅ Success toast
export const showSuccess = (message?: string) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    theme: "colored",
  });
};

// ✅ Error toast
export const showError = (message: string) => {
  toast.error(message, {
    position: "bottom-right",
    autoClose: 4000,
    theme: "colored",
  });
};

// ✅ Info toast
export const showInfo = (message: string) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 3000,
    theme: "light",
  });
};



export function getDocChunk(docSplit: any[]) {
  const docChunk = [] as any
  if (docSplit.length > 0) {
    docChunk.push(docSplit[0])
  } else {
    throw new Error('The provide Document is empty')
  }

  return docChunk
}




export const formatDocumentsAsString = (documents: Document[]): string => {
  return documents.map((doc) => doc?.pageContent).join("\n\n");
};
export async function generateTitle( doc: Document<Record<string, any>>[]) {


  const llm = new ChatCerebras({
    model: "llama-3.3-70b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.CEREBRAS_API_KEY
});

  const docToString = formatDocumentsAsString(doc)


  const jsonOutput = z.object({
    title: z.string().min(22).max(25)
  }).describe('title for document');

  const structuredLlm = llm.withStructuredOutput(jsonOutput);
  const result = await structuredLlm.invoke([

    new SystemMessage(`
            You are a helpful assistant that generates concise and clear titles.
            Based on the following document content, create a single title that
            captures the main theme or subject of the document.

            Document Content:
            ${docToString}

            Title:
        `),

  ]);
  const title = result?.title
  return title
}



export function truncateTitle(title: string, maxLength = 38): string {
  if (!title) return "";
  return title.length > maxLength
    ? title.substring(0, maxLength) + "..."
    : title;
}