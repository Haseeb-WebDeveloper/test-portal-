import React from "react";
import { Button } from "@/components/ui/button";
import { LIMIT_MESSAGE } from "@/constants/value";
import { useMessage } from "@/store/messages";
import { toast } from "sonner";
import { getFromAndTo } from "@/utils";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { IMessage } from "@/types/messages";

export default function LoadMoreMessages() {
	const page = useMessage((state) => state.page);
	const setMesssages = useMessage((state) => state.setMesssages);
	const hasMore = useMessage((state) => state.hasMore);
	const currentRoom = useMessage((state) => state.currentRoom);

	const fetchMore = async () => {
		if (!currentRoom) return;
		
		const { from, to } = getFromAndTo(page, LIMIT_MESSAGE);

		const supabase = supabaseBrowser();

		const { data, error } = await supabase
			.from("messages")
			.select("*,user:users(*)")
			.eq("roomId", currentRoom.id)
			.range(from, to)
			.order("createdAt", { ascending: false });

		if (error) {
			toast.error(error.message);
		} else {
			setMesssages(data.reverse() as unknown as IMessage[]);
		}
	};

	if (hasMore) {
		return (
			<Button variant="outline" className="w-full" onClick={fetchMore}>
				Load More
			</Button>
		);
	}
	return <></>;
}
