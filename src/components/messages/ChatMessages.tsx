"use client";
import React, { Suspense } from "react";
import ListMessages from "./ListMessages";
import InitMessages from "@/store/InitMessages";
import { useMessage } from "@/store/messages";
import ChatAbout from "./ChatAbout";

export default function ChatMessages() {
  const currentRoom = useMessage((state) => state.currentRoom);

  // If no room is selected, show the about page
  if (!currentRoom) {
    return <ChatAbout />;
  }

  return (
    <Suspense fallback={"loading.."}>
      <ListMessages />
      <InitMessages messages={[]} room={currentRoom} />
    </Suspense>
  );
}
