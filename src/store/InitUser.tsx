"use client";
import React, { useEffect, useRef } from "react";
import { useUser } from "./user";
import { User } from "@/types/messages";

export default function InitUser() {
	const initState = useRef(false);
	const setUser = useUser((state) => state.setUser);

	useEffect(() => {
		if (!initState.current) {
			// Fetch user data from our API
			const fetchUser = async () => {
				try {
					const response = await fetch('/api/auth/me');
					if (response.ok) {
						const userData = await response.json();
						setUser(userData as User);
					} else {
						console.error('Failed to fetch user data');
						setUser(undefined);
					}
				} catch (error) {
					console.error('Error fetching user data:', error);
					setUser(undefined);
				}
			};

			fetchUser();
		}
		initState.current = true;
		// eslint-disable-next-line
	}, []);

	return <></>;
}
