"use client";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useMessage } from "@/store/messages";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { toast } from "sonner";

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRef } from "react";
import { IMessage } from "@/types/messages";

export function DeleteAlert() {
	const actionMessage = useMessage((state) => state.actionMessage);
	const optimisticDeleteMessage = useMessage(
		(state) => state.optimisticDeleteMessage
	);
	const handleDeleteMessage = async () => {
		const supabase = supabaseBrowser();
		
		// Optimistic update first
		optimisticDeleteMessage(actionMessage?.id!);

		try {
			const { data, error } = await supabase
				.from("messages")
				.update({ 
					isDeleted: true,
					updatedAt: new Date().toISOString()
				})
				.eq("id", actionMessage?.id!)
				.select();

			if (error) {
				toast.error(`Delete failed: ${error.message}`);
			} else {
				toast.success("Message deleted successfully");
			}
		} catch (err) {
			toast.error("An unexpected error occurred");
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<button id="trigger-delete"></button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Are you absolutely sure?
					</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently
						delete your account and remove your data from our
						servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleDeleteMessage}>
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function EditAlert() {
	const actionMessage = useMessage((state) => state.actionMessage);
	const optimisticUpdateMessage = useMessage(
		(state) => state.optimisticUpdateMessage
	);

	const inputRef = useRef<HTMLInputElement>(null);

	const handleEdit = async () => {
		const supabase = supabaseBrowser();
		const text = inputRef.current?.value.trim();
		
		if (text) {
			// Optimistic update first
			optimisticUpdateMessage({
				...actionMessage,
				content: text,
				isEdited: true,
			} as IMessage);

			try {
				const { data, error } = await supabase
					.from("messages")
					.update({ 
						content: text, 
						isEdited: true,
						updatedAt: new Date().toISOString()
					})
					.eq("id", actionMessage?.id!)
					.select();

				if (error) {
					toast.error(`Edit failed: ${error.message}`);
				} else {
					toast.success("Message updated successfully");
				}
			} catch (err) {
				toast.error("An unexpected error occurred");
			}
			
			document.getElementById("trigger-edit")?.click();
		} else {
			document.getElementById("trigger-edit")?.click();
			document.getElementById("trigger-delete")?.click();
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<button id="trigger-edit"></button>
			</DialogTrigger>
			<DialogContent className="w-full">
				<DialogHeader>
					<DialogTitle>Edit Message</DialogTitle>
				</DialogHeader>
				<Input defaultValue={actionMessage?.content} ref={inputRef} />
				<DialogFooter>
					<Button type="submit" onClick={handleEdit}>
						Save changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
