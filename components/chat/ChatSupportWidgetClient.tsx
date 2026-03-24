"use client";

import dynamic from "next/dynamic";

const ChatSupportWidget = dynamic(
  () => import("@/components/chat/ChatSupportWidget").then((mod) => mod.ChatSupportWidget),
  { ssr: false },
);

export function ChatSupportWidgetClient() {
  return <ChatSupportWidget />;
}
