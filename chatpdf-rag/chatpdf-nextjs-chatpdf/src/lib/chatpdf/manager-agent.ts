import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
    // BaseMessage,
    SystemMessage,
    HumanMessage,
} from "@langchain/core/messages";
import { createAgent } from "langchain";


import { llmCerebras, llmFireworks } from "../llm/llm";

import { retrieverAgent } from "./sub-agent/RetrieverAgent";
import { criticAgent } from "./sub-agent/criticAgent";
import { multiQueryAgent } from "./sub-agent/multiQueryAgent";
import { plannerAgent } from "./sub-agent/plannerAgent";
import { managerSystemPrompt } from "../prompts/managerAgent";
import { trackExecTool } from "../middleware/trackExecTool";



export async function managerAgent(pdfId: string) {

    console.log('pdfid  : ', pdfId)

    const systemPrompt = managerSystemPrompt(pdfId)
    const agent = createAgent({
        model: llmFireworks,
        systemPrompt: systemPrompt,
        tools: [retrieverAgent, criticAgent, multiQueryAgent, plannerAgent],
        middleware: [trackExecTool()],
    });
    // 



    return { agent }


}

