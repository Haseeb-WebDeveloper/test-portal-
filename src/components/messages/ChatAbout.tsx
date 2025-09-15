import React from "react";
import { MessageSquare, Users, FileText } from "lucide-react";

export default function ChatAbout() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      <div className="text-center space-y-8 max-w-md">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold">Select a Room</h1>
          <p className="">
            Choose a conversation from the sidebar to start messaging
          </p>
        </div>
      </div>
    </div>
  );
}
