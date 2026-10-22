
import { readChatHistoryTool } from "@/lib/tools/chatHistoryTools";
import { NextResponse } from "next/server";



export async function GET(req:Request) {
  try {

  
  const { searchParams } = new URL(req.url);
  const pdfId = "random-0001";


    // 1. Validate required fields
    if (  !pdfId) {
      return NextResponse.json(
        { ok: false, message: "projectId and pdfId are required" },
        { status: 400 }
      );
    }


    const retrievedMessages=await readChatHistoryTool.invoke({pdfId})
    const messages=JSON.parse(retrievedMessages)

       
  
    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
