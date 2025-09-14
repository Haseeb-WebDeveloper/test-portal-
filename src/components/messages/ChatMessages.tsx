"use client";
import React, { Suspense } from "react";
import ListMessages from "./ListMessages";
import { useMessage } from "@/store/messages";
import ChatAbout from "./ChatAbout";

export default function ChatMessages() {
  const currentRoom = useMessage((state) => state.currentRoom);

  // If no room is selected, show the about page
  if (!currentRoom) {
    return <ChatAbout />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Suspense fallback={"loading.."}>
        <ListMessages />
      </Suspense>
    </div>
  );
}
