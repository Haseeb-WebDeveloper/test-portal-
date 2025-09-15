import ChatAbout from "@/components/messages/ChatAbout";
import ChatHeader from "@/components/messages/ChatHeader";
import ChatInput from "@/components/messages/ChatInput";
import ChatMessages from "@/components/messages/ChatMessages";
import RoomSidebar from "@/components/messages/RoomSidebar";
import React from "react";
import InitMessages from "@/store/InitMessages";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function Page() {
  return (
    <div className="h-[calc(100vh-75px)] bg-[#0F0A1D] flex overflow-hidden">
      {/* Initialize current room from query param on client */}
      <InitMessages messages={[]} />
      {/* Room Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block h-full">
        <RoomSidebar />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        <ChatHeader />
        <div className="flex-1 flex flex-col min-h-0">
          <ChatMessages />
        </div>
        <div className="flex-shrink-0">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
