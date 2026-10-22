
import { tool } from "@langchain/core/tools";
import z from "zod";
import { queryMultiVector } from "../pipelines/muti-vector";

export const retrieverTool = tool(
  async ({ query,pdfId }) => {
    const retrievedDocs = await queryMultiVector({query,pdfId})

    console.log('RETRIEVED DOCS ++ + :: : ',retrievedDocs)
    const serialized = retrievedDocs
      .map(
        (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
      )
      .join("\n");
    return serialized
  },
  {
    name: "retriever",
    description: "Retrieve information related to a query from a vector database.",
    schema:  z.object({ query: z.string() ,

    //    projectId: z.string().describe("projectId used to fetch data for this user"),
            pdfId: z.string().describe("pdfId used to fetch data "),

    }),
  }
);




