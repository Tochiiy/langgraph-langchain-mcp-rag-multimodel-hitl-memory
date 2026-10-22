import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

export class UploadFileService {
  private static instance: UploadFileService;

  public static getInstance(): UploadFileService {
    if (!UploadFileService.instance) {
      UploadFileService.instance = new UploadFileService();
    }
    return UploadFileService.instance;
  }

 



  async uploadPdfFile(file: File) {
    if (!file || file.size === 0) {
      throw new Error("No file uploaded");
    }

    if (file.type && file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      throw new Error("Only PDF files are allowed");
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const parsedName = path.parse(file.name || "document.pdf");
    const safeBaseName = parsedName.name.replace(/[^a-zA-Z0-9-_]/g, "_") || "file";
    const extension = parsedName.ext || ".pdf";
    const uniqueName = `${safeBaseName}-${Date.now()}-${randomUUID()}${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;
    return {
      fileUrl,
      fileSize: file.size,
      name: file.name || uniqueName,
    };
  }

  async removeStoredFile(fileUrl?: string) {
    await this.deleteFile(fileUrl);
  }

  private async deleteFile(fileUrl?: string) {
    if (!fileUrl) return;

    const relativePath = fileUrl.replace(/^[/\\]+/, "");
    const absolutePath = path.join(process.cwd(), "public", relativePath);

    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      console.warn(`Failed to delete file at ${absolutePath}: ${(error as Error).message}`);
    }
  }
}
