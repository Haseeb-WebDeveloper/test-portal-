"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/store/user";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { IMessage, MessageType, } from "@/types/messages";
import { useMessage } from "@/store/messages";

export default function ChatInput() {
  const user = useUser((state) => state.user);
  const addMessage = useMessage((state) => state.addMessage);
  const setOptimisticIds = useMessage((state) => state.setOptimisticIds);
  const currentRoom = useMessage((state) => state.currentRoom);
  const supabase = supabaseBrowser();

  const handleSendMessage = async (text: string) => {
    if (!currentRoom) {
      toast.error("Please select a room first");
      return;
    }

    if (text.trim()) {
      const id = uuidv4();
       const newMessage = {
         id,
         roomId: currentRoom.id,
         userId: user?.id!,
         content: text,
         messageType: MessageType.TEXT,
         isEdited: false,
         isDeleted: false,
         createdAt: new Date(),
         updatedAt: new Date(),
         user: user!,
       };
      addMessage(newMessage as IMessage);
      setOptimisticIds(newMessage.id);

      const { data, error } = await supabase.from("messages").insert({
        id,
        roomId: currentRoom.id,
        userId: user?.id!,
        content: text,
        messageType: MessageType.TEXT,
        isEdited: false,
        isDeleted: false,
        createdBy: user?.id,
        updatedBy: user?.id,
        updatedAt: new Date().toISOString(),
      }).select();
      
      if (error) {
        console.error("Message insert error:", error);
        toast.error(`Failed to send message: ${error.message}`);
      } else {
        console.log("Message sent successfully:", data);
      }
    } else {
      toast.error("Message can not be empty!!");
    }
  };

  return (
    <div className="p-5">
      <Input
        placeholder="send message"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSendMessage(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
      />
    </div>
  );
}
