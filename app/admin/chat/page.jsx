import React, { Suspense } from "react";
import AdminChatPanel from "@/components/chat/admin-chat-panel";

function ChatFallback() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-80px)] text-quaternary">
      Loading chat…
    </div>
  );
}

export default function AdminChatPage() {
  return (
    <Suspense fallback={<ChatFallback />}>
      <AdminChatPanel />
    </Suspense>
  );
}
