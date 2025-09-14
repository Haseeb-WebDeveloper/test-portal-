"use client";
import React, { useState } from "react";
import { useUser } from "@/store/user";
import { useMessage } from "@/store/messages";
import ChatPresence from "./ChatPresence";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import RoomSidebar from "./RoomSidebar";

export default function ChatHeader() {
  const user = useUser((state) => state.user);
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
      <div className="h-20">
        <div className="p-5 border-b flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setShowMobileSidebar(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div>
              <h1 className="text-xl font-bold">
                {currentRoom ? currentRoom.name : "Messages"}
              </h1>
              {currentRoom && (
                <p className="text-sm text-gray-500">
                  {currentRoom.description || "General discussion"}
                </p>
              )}
              <ChatPresence />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              </div>
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
