"use client";
import React, { useEffect, useRef } from "react";
import { LIMIT_MESSAGE } from "@/constants/value";
import { IMessage, Room, RoomType } from "@/types/messages";
import { useMessage } from "./messages";

export default function InitMessages({ 
	messages, 
	room 
}: { 
	messages: IMessage[];
	room?: Room;
}) {
	const initState = useRef(false);
	const hasMore = messages.length >= LIMIT_MESSAGE;

	useEffect(() => {
		if (initState.current) return;

		// Initialize from props first
		useMessage.setState({ 
			messages, 
			hasMore,
			currentRoom: room || null,
			page: 1
		});

		// If URL contains roomId, set that as current room
		try {
			const url = new URL(window.location.href);
			const roomId = url.searchParams.get('roomId');
			if (roomId) {
				useMessage.setState({
					currentRoom: {
						id: roomId,
						name: "",
						type: RoomType.GENERAL,
						avatar: undefined,
						lastMessageAt: undefined,
						isActive: true,
						isArchived: false,
						createdAt: new Date(),
						updatedAt: new Date(),
					}
				});
			}
		} catch (e) {
			// ignore
		}

		initState.current = true;
		// eslint-disable-next-line
	}, []);

	return <></>;
}
