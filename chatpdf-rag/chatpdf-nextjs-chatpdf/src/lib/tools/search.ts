
import z from "zod";
import { tool } from "@langchain/core/tools";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";




  export const searchTool = tool(
    async ({ query }) => {
      const client = new Exa(process.env.EXA_SEARCH_API_KEY);

      const exaTool = new ExaSearchResults({
        client,
        searchArgs: {
          numResults: 1,
          type:'auto'
          // type: 'deep',
        },
      })


      const result = await exaTool.invoke(query);
      const parseResult=JSON.stringify(result)
      return parseResult

    },
    {
      name: "search_web",
      description: "Search the web  to find real-time information.",
      schema: z.object({
        query: z.string(),
      }),
    }
  );

  