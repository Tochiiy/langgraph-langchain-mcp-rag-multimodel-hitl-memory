"use client";

import { useState, useRef } from "react";
import { Paperclip, ImageIcon, Loader2 } from "lucide-react";
import { cn, showError, showSuccess } from "@/lib/utils";
import { fetchPdfList } from "@/stores/pdfSlice";
import { AppDispatch } from "@/stores";
import { useDispatch } from "react-redux";

const UploadFileButton = ({ pdfId }: { pdfId: string }) => {

     const dispatch = useDispatch<AppDispatch>();
     
  const [uploadPdfLoading, setUploadPdfLoading] = useState(false);
  const [uploadImgLoading, setUploadImgLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File, type: "pdf" | "image") => {
    type==='pdf'? setUploadPdfLoading(true):setUploadImgLoading(true)

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pdfId", pdfId);
      formData.append("type", type); // optional: send type to server

      const res = await fetch("http://localhost:8000/api/upload/pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`${type} upload failed:`, data.error);
        showError(`${type} upload failed `);
        return;
      }

       dispatch(fetchPdfList());
      showSuccess(data?.message);
    } catch (err) {
      console.error(`Unexpected ${type} upload error:`, err);
      showError(`Unexpected ${type} upload error`);
    } finally {
      type==='pdf'? setUploadPdfLoading(false):setUploadImgLoading(false)
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUpload(file, "pdf");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUpload(file, "image");
  };

  const triggerFileInput = (type: "pdf" | "image") => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "pdf" ? ".pdf" : "image/*";
      fileInputRef.current.onchange = type === "pdf" ? handlePdfUpload : handleImageUpload;
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex items-center gap-3 text-slate-500">
      {/* Hidden file input */}
      <input type="file" className="hidden" ref={fileInputRef} />

   


 <button
  onClick={() => {
    if (!uploadPdfLoading) {
      triggerFileInput("pdf");
    }
  }}
  disabled={uploadPdfLoading}
  className={cn(
    "flex gap-2 relative items-center text-xs transition",
    uploadPdfLoading
      ? "cursor-not-allowed opacity-60"
      : "cursor-pointer hover:text-slate-700"
  )}
>
  {uploadPdfLoading ? (
    <div className="flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Embedding in progress…</span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Paperclip size={16} />
      <span>Upload PDF</span>
    </div>
  )}
</button>

     
    </div>
  );
};

export default UploadFileButton;
