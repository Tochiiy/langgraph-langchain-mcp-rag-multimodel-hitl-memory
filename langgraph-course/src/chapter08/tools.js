import { z } from "zod";

import { tool } from "@langchain/core/tools";
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
        name: "searchTool",
        description: "Search the web  to find real-time information.",
        schema: z.object({
            query: z.string(),
        }),
    }
);