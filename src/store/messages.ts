import { create } from "zustand";
import { LIMIT_MESSAGE } from "@/constants/value";
import { IMessage, Room } from "@/types/messages";


interface MessageState {
	hasMore: boolean;
	page: number;
	messages: IMessage[];
	actionMessage: IMessage | undefined;
	optimisticIds: string[];
	currentRoom: Room | null;
	addMessage: (message: IMessage) => void;
	setActionMessage: (message: IMessage | undefined) => void;
	optimisticDeleteMessage: (messageId: string) => void;
	optimisticUpdateMessage: (message: IMessage) => void;
	setOptimisticIds: (id: string) => void;
	setMesssages: (messages: IMessage[]) => void;
	loadMoreMessages: (messages: IMessage[]) => void;
	setCurrentRoom: (room: Room | null) => void;
	clearMessages: () => void;
}

export const useMessage = create<MessageState>()((set) => ({
	hasMore: true,
	page: 1,
	messages: [],
	optimisticIds: [],
	actionMessage: undefined,
	currentRoom: null,
	setMesssages: (messages) =>
		set(() => ({
			messages,
			page: 1,
			hasMore: messages.length >= LIMIT_MESSAGE,
		})),
	loadMoreMessages: (messages) =>
		set((state) => ({
			messages: [...messages, ...state.messages],
			page: state.page + 1,
			hasMore: messages.length >= LIMIT_MESSAGE,
		})),
	setOptimisticIds: (id: string) =>
		set((state) => ({ optimisticIds: [...state.optimisticIds, id] })),
	addMessage: (newMessages) =>
		set((state) => ({
			messages: [...state.messages, newMessages],
		})),
	setActionMessage: (message) => set(() => ({ actionMessage: message })),
	optimisticDeleteMessage: (messageId) =>
		set((state) => {
			return {
				messages: state.messages.filter(
					(message) => message.id !== messageId
				),
			};
		}),
	optimisticUpdateMessage: (updateMessage) =>
		set((state) => {
			return {
				messages: state.messages.map((message) => {
					if (message.id === updateMessage.id) {
						return {
							...message,
							content: updateMessage.content,
							isEdited: updateMessage.isEdited,
						};
					}
					return message;
				}),
			};
		}),
	setCurrentRoom: (room) => set(() => ({ currentRoom: room })),
	clearMessages: () => set(() => ({ messages: [], page: 1, hasMore: true })),
}));
