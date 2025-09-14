import ChatAbout from "@/components/messages/ChatAbout";
import ChatHeader from "@/components/messages/ChatHeader";
import ChatInput from "@/components/messages/ChatInput";
import ChatMessages from "@/components/messages/ChatMessages";
import RoomSidebar from "@/components/messages/RoomSidebar";
import InitUser from "@/store/InitUser";
import React from "react";

export default async function Page() {
  return (
    <>
      <div className="h-screen flex bg-gray-950">
        {/* Room Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block">
          <RoomSidebar />
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatHeader />
          <div className="flex-1 flex flex-col relative">
            <ChatMessages />
            <ChatInput />
          </div>
        </div>
      </div>
      <InitUser />
    </>
  );
}
