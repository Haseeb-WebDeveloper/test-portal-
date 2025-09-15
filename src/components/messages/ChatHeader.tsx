"use client";
import React, { useState } from "react";
import { useMessage } from "@/store/messages";
import ChatPresence from "./ChatPresence";
import RoomManagementModal from "./RoomManagementModal";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Menu, X } from "lucide-react";
import RoomSidebar from "./RoomSidebar";

export default function ChatHeader() {
  const currentRoom = useMessage((state) => state.currentRoom);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Listen for close mobile sidebar event
  React.useEffect(() => {
    const handleCloseMobileSidebar = () => {
      setShowMobileSidebar(false);
    };

    window.addEventListener("closeMobileSidebar", handleCloseMobileSidebar);
    return () => {
      window.removeEventListener(
        "closeMobileSidebar",
        handleCloseMobileSidebar
      );
    };
  }, []);

  return (
    <>
      <div className="h-24">
        <div className="p-5 border-b flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden "
              onClick={() => setShowMobileSidebar(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Room Avatar and Info */}
            <div className="flex items-center gap-3">
              {currentRoom && (
                <Avatar className="w-10 h-10">
                  {currentRoom.avatar ? (
                    <img 
                      src={currentRoom.avatar} 
                      alt={currentRoom.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {currentRoom.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Avatar>
              )}
              
              <div>
                <h1 className="figma-paragraph">
                  {currentRoom ? currentRoom.name : "Messages"}
                </h1>
                {currentRoom && (
                  <p className="figma-paragraph text-foreground/50">
                    {currentRoom.description || "General discussion"}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ChatPresence />
            
            {/* Room Management */}
            {currentRoom && (
              <RoomManagementModal 
                room={currentRoom}
                onRoomUpdated={() => {
                  // Room will be updated in the store automatically
                }}
                onRoomDeleted={() => {
                  // Room will be cleared from store automatically
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 bg-gray-900 border-r border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Rooms</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileSidebar(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="h-full overflow-y-auto">
              <RoomSidebar />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
