
import { llmFireworks } from "@/lib/llm/llm";
import { trackExecTool } from "@/lib/middleware/trackExecTool";
import { writeToChatHistoryTool } from "@/lib/tools/chatHistoryTools";
import { createAgent, tool } from "langchain";

import { MultiServerMCPClient } from "@langchain/mcp-adapters";


export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);

    const message = url.searchParams.get("message")!;
    const pdfId = "random-0001";

    const client = new MultiServerMCPClient({
      mcpServers: {
        "chat-over-document-mcp": {
          transport: "http",
          url: "http://localhost:3001/mcp",
          headers: {
                "x-api-key":process.env.MCP_API_KEY as string
            }
        }
      }

    })

    const mcpTools = await client.getTools();

    const agent = createAgent({
      model: llmFireworks,
      systemPrompt: `
      Your are Chat over document  Agent  with access to a standard number of tools

      # Tools 
      
      - queryTransformer tool : allows to transform user input to multiple versions of it for semantic search retrieval
      - retriever tool : generates multiple version of user input for semantic search retrieval

      # How to Retrieve data 

      - step 1 : transform user query to multiple version using  queryTransformer tool
      - step 2 : queryTransformer tool returns multiple version of the user input 
      - step 3 : invoke the retriever tool by passing it these input to retrieve data in vector db
      - step 4 : summarize the retrieve data 
      - step 5 : You will get the data in this format
        <retrieved_document>
        ...
        </retrieved_document>
        <retrieved_images>
       image1_url, image2_url,image3_url, etc...
        </retrieved_images>
      - step 6 : summarize Retrieved document
      - step 7 : to display image in retrieved_images tag you will pass this in your final response ,so that we can visualize it
       eg: ![Alt Text](image1_url), ![Alt Text](image2_url),etc...

      - Your output format should be in Markdown
      `,
      tools: [...mcpTools],
      middleware: [trackExecTool()],
    });


    const encoder = new TextEncoder();

    const sse = (event: string, data: any) =>
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    await writeToChatHistoryTool.invoke({ messages: [{ role: 'user', content: message, pdfId }] })
    let streamingText = ''
    let thinkingBuffer = "";
    const stream = new ReadableStream({
      async start(controller) {
        try {

          for await (const chunk of await agent.stream(
            { messages: [{ role: "user", content: message }] },
            { streamMode: "updates" }
          )) {



            const req = chunk?.model_request?.messages

            if (req && req.length > 0) {
              streamingText += req[0]?.content
              controller.enqueue(sse("message", { message: req[0]?.content }));
            }

          }

          setTimeout(async () => {
            controller.enqueue(sse("end", { ok: true }));
            await writeToChatHistoryTool.invoke({ messages: [{ role: 'ai', thinking: thinkingBuffer, content: streamingText, pdfId }] })

            controller.close()
          }, 1000);

        } catch (error) {
          controller.enqueue(sse("error", { ok: true }));
          console.log('Error : ', (error as Error)?.message)
        }
      },
    });


    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });

  } catch (err: any) {
    console.log('error :  ', err?.message)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};


