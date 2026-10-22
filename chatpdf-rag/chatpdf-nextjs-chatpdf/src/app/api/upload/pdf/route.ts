import { NextResponse } from "next/server";
import path from "path";
import { UploadFileService } from "@/services/chatpdf/UploadFileService";
import { docEmbeddingMultiVector } from "@/lib/pipelines/muti-vector";


export const POST = async (req: Request) => {
 

  const formData = await req.formData();
  const file = formData.get("file");
    const pdfId = crypto.randomUUID()



  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF file is required" }, { status: 400 });
  }

  const uploadService = UploadFileService.getInstance();
  let uploadResult: { fileUrl: string; fileSize: number; name: string } | null = null;

  try {
    uploadResult = await uploadService.uploadPdfFile(file);

    const fullPath = path.join(process.cwd(), "public", uploadResult.fileUrl)

  
    await docEmbeddingMultiVector({ urls: [fullPath], pdfId})



    return NextResponse.json({ message: "PDF uploaded" }, { status: 201 });
  } catch (error: any) {
 
    const message = error?.message || "Failed to upload PDF";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};
