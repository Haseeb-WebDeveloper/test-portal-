"use client";
import React, { useEffect, useRef, useState } from "react";
import { DeleteAlert, EditAlert } from "./MessasgeActions";
import { toast } from "sonner";
import { ArrowDown } from "lucide-react";
import LoadMoreMessages from "./LoadMoreMessages";
import { useMessage } from "@/store/messages";
import { IMessage, IMessageType } from "@/types/messages";
import { LIMIT_MESSAGE } from "@/constants/value";
import { supabaseBrowser } from "@/utils/supabase/browser";
import Message from "./Message";

export default function ListMessages() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [notification, setNotification] = useState(0);

  const {
    messages,
    addMessage,
    optimisticIds,
    optimisticDeleteMessage,
    optimisticUpdateMessage,
  } = useMessage((state) => state);

  const supabase = supabaseBrowser();
  const currentRoom = useMessage((state) => state.currentRoom);
  const setMesssages = useMessage((state) => state.setMesssages);

  // Load messages when room changes
  useEffect(() => {
    if (!currentRoom) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*,user:users(*)")
        .eq("roomId", currentRoom.id)
        .range(0, LIMIT_MESSAGE)
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("Error loading messages:", error);
      } else {
        setMesssages(data?.reverse() || [] as unknown as IMessage[]);
      }
    };

    loadMessages();
  }, [currentRoom, supabase, setMesssages]);

  useEffect(() => {
    if (!currentRoom) return;

    const channel = supabase
      .channel(`room-${currentRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `roomId=eq.${currentRoom.id}`,
        },
        async (payload) => {
          if (!optimisticIds.includes(payload.new.id)) {
            const { error, data } = await supabase
              .from("users")
              .select("*")
              .eq("id", payload.new.userId)
              .single();
            if (error) {
              toast.error(error.message);
            } else {
              const newMessage = {
                ...payload.new,
                user: data,
              };
              addMessage(newMessage as unknown as IMessage);
            }
          }
          const scrollContainer = scrollRef.current;
          if (
            scrollContainer &&
            scrollContainer.scrollTop <
              scrollContainer.scrollHeight - scrollContainer.clientHeight - 10
          ) {
            setNotification((current) => current + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `roomId=eq.${currentRoom.id}`,
        },
        (payload) => {
          optimisticDeleteMessage(payload.old.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `roomId=eq.${currentRoom.id}`,
        },
        (payload) => {
          optimisticUpdateMessage(payload.new as unknown as IMessage);
        }
      )
      .subscribe();

	  console.log("channel", channel);

    return () => {
      channel.unsubscribe();
    };
  }, [currentRoom, messages]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer && !userScrolled) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleOnScroll = () => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      const isScroll =
        scrollContainer.scrollTop <
        scrollContainer.scrollHeight - scrollContainer.clientHeight - 10;
      setUserScrolled(isScroll);
      if (
        scrollContainer.scrollTop ===
        scrollContainer.scrollHeight - scrollContainer.clientHeight
      ) {
        setNotification(0);
      }
    }
  };
  const scrollDown = () => {
    setNotification(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  return (
    <>
      <div
        className="flex-1 flex flex-col p-5 h-full overflow-y-auto"
        ref={scrollRef}
        onScroll={handleOnScroll}
      >
        <div className="flex-1 pb-5 ">
          <LoadMoreMessages />
        </div>
        <div className=" space-y-7">
          {messages.map((value, index) => {
            return <Message key={index} message={value as unknown as IMessage} />;
          })}
        </div>

        <DeleteAlert />
        <EditAlert />
      </div>
      {userScrolled && (
        <div className=" absolute bottom-20 w-full">
          {notification ? (
            <div
              className="w-36 mx-auto bg-indigo-500 p-1 rounded-md cursor-pointer"
              onClick={scrollDown}
            >
              <h1>New {notification} messages</h1>
            </div>
          ) : (
            <div
              className="w-10 h-10 bg-blue-500 rounded-full justify-center items-center flex mx-auto border cursor-pointer hover:scale-110 transition-all"
              onClick={scrollDown}
            >
              <ArrowDown />
            </div>
          )}
        </div>
      )}
    </>
  );
}
