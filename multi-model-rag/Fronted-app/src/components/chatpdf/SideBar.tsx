"use client";

import { useEffect, useState } from "react";


import { cn, truncateTitle } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/stores";
import { fetchChatHistory, setPdfId } from "@/stores/chatSlice";
import { FileText } from "lucide-react";

export default function Sidebar() {
 

  const [menuOpen, setMenuOpen] = useState(true);



    const dispatch = useDispatch<AppDispatch>();
 

  return (
    <div className="relative flex h-full overflow-hidden">
      <aside
        className={cn(
          "flex flex-col border-r bg-slate-50 transition-all",
          menuOpen ? "w-65" : "w-0"
        )}
      >
        <div className={cn("flex h-full flex-col", !menuOpen && "hidden")}>
          
          <div className="ml-6 mt-5 font-bold ">
           Multi-Modal RAG
          </div>
          {/* <nav className="space-y-1 px-2 py-3 text-sm">
            {pdfList.length === 0 ? (
              <MenuItem icon={<FileText size={16} />} label="No PDFs" />
            ) : (
              pdfList.map((pdf) => (
                <MenuItem
                onClick={() => handlePdfClick(pdf.pdfId)}
                  key={pdf.pdfId}
                  icon={<FileText size={16} />}
                  label={ truncateTitle(pdf.title,22)}
                />
              ))
            )}
          </nav> */}
        </div>
        
      </aside>

    </div>
  );
}

function MenuItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 cursor-pointer",
        active ? "bg-slate-200 font-medium" : "hover:bg-slate-200"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
