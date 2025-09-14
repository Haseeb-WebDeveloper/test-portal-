"use client";
import React, { useEffect, useRef } from "react";
import { LIMIT_MESSAGE } from "@/constants/value";
import { IMessage, Room } from "@/types/messages";
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
		if (!initState.current) {
			useMessage.setState({ 
				messages, 
				hasMore,
				currentRoom: room || null
			});
		}
		initState.current = true;
		// eslint-disable-next-line
	}, []);

	return <></>;
}
