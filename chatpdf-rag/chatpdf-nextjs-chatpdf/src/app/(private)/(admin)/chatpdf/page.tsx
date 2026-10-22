"use client";

import ChatPanel from "@/components/chatpdf/ChatPanel";
// import ChatPanel from "@/components/chatpdf/ChatPanel";
import Sidebar from "@/components/chatpdf/SideBar";

export default function Page() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        <ChatPanel pdfId="" />
      </main>
    </div>
  );
}
