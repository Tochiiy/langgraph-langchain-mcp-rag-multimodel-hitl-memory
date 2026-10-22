import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
    // BaseMessage,
    SystemMessage,
    HumanMessage,
} from "@langchain/core/messages";
import { createAgent } from "langchain";
import { ChatCerebras } from "@langchain/cerebras";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";

import "dotenv/config";


const client = new Exa(process.env.EXA_SEARCH_API_KEY);
export const searchTool = tool(
    async ({ query }) => {

        const exaTool = new ExaSearchResults({
            client,
            searchArgs: {
                numResults: 1,
                type: "auto",
            },
        })

        const result = await exaTool.invoke(query);
        return result

    },
    {
        name: "search_web",
        description: "Search the web  to find real-time information.",
        schema: z.object({
            query: z.string(),
        }),
    }
);
