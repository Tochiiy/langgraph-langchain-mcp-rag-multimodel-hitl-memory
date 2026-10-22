
import { createMiddleware, AIMessage } from "langchain";

export const trackExecTool = ()=>{
  return createMiddleware({
  name: "trackExecToolMiddleware",
  wrapToolCall: async(request, handler) => {
    console.log('tool NAME :====:::',request.toolCall.name)
    console.log(`Tool called : ${JSON.stringify(request.toolCall.args)}`);
    try {

      const result = await handler(request);
   
      console.log("Tool completed successfully");
      return result;
    } catch (e) {
      console.log(`Tool failed: ${e}`);
      throw e;
    }
  },
});


}