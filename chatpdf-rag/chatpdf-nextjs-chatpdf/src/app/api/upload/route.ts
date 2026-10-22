// addPdf

import { getAllPdfs } from "@/helper/pdf-db";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
 

  
  try {
    const pdfs=getAllPdfs()

    return NextResponse.json(pdfs);
  } catch (error: any) {
 
    const message = error?.message || "Failed to upload PDF";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};
