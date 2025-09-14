import { useMessage } from "@/store/messages";
import React from "react";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useUser } from "@/store/user";
import { IMessage } from "@/types/messages";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function Message({ message }: { message: IMessage }) {
  const user = useUser((state) => state.user);

  return (
    <div className="flex gap-2">
      <div>
        <Avatar className="rounded-full ring-2 w-10 h-10">
          <AvatarImage
            src={message.user?.avatar || undefined}
            alt={message.user?.name || "User"}
          />
          <AvatarFallback>
            {message.user?.name
              ? message.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : "?"}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <h1 className="font-bold">{message.user?.name}</h1>
            <h1 className="text-sm text-gray-400">
              {new Date(message.createdAt).toDateString()}
            </h1>
            {message.isEdited && (
              <h1 className="text-sm text-gray-400">edited</h1>
            )}
          </div>
          {message.user?.id === user?.id && <MessageMenu message={message} />}
        </div>
        <p className="text-gray-300">{message.content}</p>
      </div>
    </div>
  );
}

const MessageMenu = ({ message }: { message: IMessage }) => {
  const setActionMessage = useMessage((state) => state.setActionMessage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Action</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            document.getElementById("trigger-edit")?.click();
            setActionMessage(message);
          }}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            document.getElementById("trigger-delete")?.click();
            setActionMessage(message);
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
