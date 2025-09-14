"use client";
import { useUser } from "@/store/user";
import { useMessage } from "@/store/messages";
import { createClient } from "@/utils/supabase/clients";
import React, { useEffect, useState } from "react";
import { supabaseBrowser } from "@/utils/supabase/browser";

export default function ChatPresence() {
	const user = useUser((state) => state.user);
	const currentRoom = useMessage((state) => state.currentRoom);
	const supabase = supabaseBrowser();
	const [onlineUsers, setOnlineUsers] = useState(0);

	useEffect(() => {
		if (!user || !currentRoom) return;

		const channel = supabase.channel(`room-${currentRoom.id}`);
		channel
			.on("presence", { event: "sync" }, () => {
				const userIds = [];
				for (const id in channel.presenceState()) {
					// @ts-ignore
					userIds.push(channel.presenceState()[id][0].user_id);
				}
				setOnlineUsers([...new Set(userIds)].length);
			})
			.subscribe(async (status) => {
				if (status === "SUBSCRIBED") {
					await channel.track({
						online_at: new Date().toISOString(),
						user_id: user.id,
						user_name: user.name,
					});
				}
			});

		return () => {
			channel.unsubscribe();
		};
	}, [user, currentRoom]);

	if (!user || !currentRoom) {
		return <div className=" h-3 w-1"></div>;
	}

	return (
		<div className="flex items-center gap-1">
			<div className="h-4 w-4 bg-green-500 rounded-full animate-pulse"></div>
			<h1 className="text-sm text-gray-400">{onlineUsers} online</h1>
		</div>
	);
}
