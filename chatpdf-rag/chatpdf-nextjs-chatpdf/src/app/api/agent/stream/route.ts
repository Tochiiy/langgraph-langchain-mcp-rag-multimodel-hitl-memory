
import { managerAgent } from "@/lib/chatpdf/manager-agent";
import { writeToChatHistoryTool } from "@/lib/tools/chatHistoryTools";
import { ChatCerebras } from "@langchain/cerebras";
import { createAgent, tool } from "langchain";




export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);

    const message = url.searchParams.get("message")!;
    const pdfId = url.searchParams.get("pdfId")!;




    const { agent } = await managerAgent(pdfId)




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

        

              // console.log("whole chunk    :", chunk)
              // // Intermediate: thinking before tools

              const updates = chunk?.tools?.messages

              if (updates && updates.length > 0) {
                  thinkingBuffer += updates[0].content;
                controller.enqueue(sse("thinking", { thinking: updates[0].content }));
              }

                const req=chunk?.model_request?.messages

                if(req && req.length>0){
                  streamingText+= req[0]?.content 
                  controller.enqueue(sse("message", { message: req[0]?.content }));
                }
  
          }

          setTimeout(async () => {
            controller.enqueue(sse("end", { ok: true }));
            await writeToChatHistoryTool.invoke({ messages: [{ role: 'ai',thinking:thinkingBuffer, content: streamingText, pdfId }] })

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


