
import { tool } from "@langchain/core/tools";
import z from "zod";
import {queryMultiVector} from '../../src/multi-vector-retriever.js'
export const retrieverTool = tool(
  async ({ query,docId }) => {
 

     const result = await queryMultiVector({docId:"ben123",query}) 

    const serialized = result?.retrievedDocs
      .map(
        (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
      )
      .join("\n");
    return serialized
  },
  {
    name: "retriever",
    description: "Retrieve information related to a query from a vector database.",
    schema:  z.object({ 
        query: z.string() ,
         docId: z.string().describe("docId used to fetch data "),

    }),
  }
);




