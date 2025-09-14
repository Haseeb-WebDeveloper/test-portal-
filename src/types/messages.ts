// Message-related TypeScript interfaces based on Prisma schema

// ============================================================================
// ENUMS
// ============================================================================

export enum RoomType {
  GENERAL = 'GENERAL',
  CONTRACT_SPECIFIC = 'CONTRACT_SPECIFIC',
  CLIENT_SPECIFIC = 'CLIENT_SPECIFIC',
  AGENCY_INTERNAL = 'AGENCY_INTERNAL',
}

export enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export enum PermissionType {
  READ = 'READ',
  WRITE = 'WRITE',
  ADMIN = 'ADMIN',
  NONE = 'NONE',
}

// ============================================================================
// CORE MESSAGE ENTITIES
// ============================================================================

export interface Room {
  id: string;
  name: string;
  description?: string;
  type: RoomType;
  clientId?: string;
  contractId?: string;
  proposalId?: string;
  avatar?: string;
  isActive: boolean;
  isArchived: boolean;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
  
  // Relations
  client?: Client;
  contract?: Contract;
  proposal?: Proposal;
  messages?: IMessage[];
  participants?: RoomParticipant[];
}

export interface RoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  permission: PermissionType;
  joinedAt: Date;
  lastReadAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
  
  // Relations
  room?: Room;
  user?: User;
}

export interface IMessage {
  id: string;
  roomId: string;
  userId: string;
  content?: string;
  parentId?: string;
  contractId?: string;
  isEdited: boolean;
  isDeleted: boolean;
  messageType: MessageType;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
  
  // Relations
  room?: Room;
  user?: User;
  contract?: Contract;
  parent?: IMessage;
  replies?: IMessage[];
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  message?: IMessage;
}

// ============================================================================
// SUPPORTING ENTITIES (Minimal for messaging context)
// ============================================================================

export interface User {
  id: string;
  authId: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
}

export interface Client {
  id: string;
  name: string;
  description?: string;
  website?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
}

export interface Contract {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  currency: string;
  actualHours: number;
  budget?: number;
  estimatedHours?: number;
  priority: number;
  progressPercentage: number;
  tags: string[];
  media?: any;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
}

export interface Proposal {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: string;
  hasReviewed: boolean;
  tags: string[];
  media?: any;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateRoomRequest {
  name: string;
  description?: string;
  type: RoomType;
  clientId?: string;
  contractId?: string;
  proposalId?: string;
  avatar?: string;
  participantIds: string[];
}

export interface CreateRoomResponse {
  room: Room;
  participants: RoomParticipant[];
}

export interface SendMessageRequest {
  roomId: string;
  content?: string;
  messageType: MessageType;
  parentId?: string;
  contractId?: string;
  attachments?: File[];
}

export interface SendMessageResponse {
  message: IMessage;
  attachments?: MessageAttachment[];
}

export interface GetMessagesRequest {
  roomId: string;
  page?: number;
  limit?: number;
  parentId?: string; // For threaded messages
}

export interface GetMessagesResponse {
  messages: IMessage[];
  hasMore: boolean;
  totalCount: number;
}

export interface GetRoomsRequest {
  userId: string;
  type?: RoomType;
  isActive?: boolean;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface GetRoomsResponse {
  rooms: Room[];
  hasMore: boolean;
  totalCount: number;
}

export interface AddParticipantRequest {
  roomId: string;
  userId: string;
  permission: PermissionType;
}

export interface UpdateParticipantRequest {
  participantId: string;
  permission?: PermissionType;
  isActive?: boolean;
}

export interface MarkAsReadRequest {
  roomId: string;
  userId: string;
  lastReadAt?: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface MessageWithDetails extends IMessage {
  user: User;
  attachments: MessageAttachment[];
  replies: MessageWithDetails[];
  replyCount: number;
}

export interface RoomWithDetails extends Room {
  participants: (RoomParticipant & { user: User })[];
  lastMessage?: MessageWithDetails;
  unreadCount: number;
}

export interface RoomSummary {
  id: string;
  name: string;
  type: RoomType;
  avatar?: string;
  lastMessageAt?: Date;
  lastMessage?: {
    content?: string;
    user: Pick<User, 'id' | 'name' | 'avatar'>;
    createdAt: Date;
  };
  unreadCount: number;
  participantCount: number;
}

export interface MessageThread {
  parentMessage: MessageWithDetails;
  replies: MessageWithDetails[];
  totalReplies: number;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface MessageFormData {
  content: string;
  messageType: MessageType;
  parentId?: string;
  contractId?: string;
  attachments: File[];
}

export interface RoomFormData {
  name: string;
  description: string;
  type: RoomType;
  clientId?: string;
  contractId?: string;
  proposalId?: string;
  avatar?: File;
  participantIds: string[];
}

// ============================================================================
// FILTER AND SORT TYPES
// ============================================================================

export interface MessageFilters {
  roomId?: string;
  userId?: string;
  messageType?: MessageType;
  isDeleted?: boolean;
  parentId?: string;
  contractId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface RoomFilters {
  type?: RoomType;
  clientId?: string;
  contractId?: string;
  proposalId?: string;
  isActive?: boolean;
  isArchived?: boolean;
  hasUnread?: boolean;
}

export interface MessageSortOptions {
  field: 'createdAt' | 'updatedAt';
  order: 'asc' | 'desc';
}

export interface RoomSortOptions {
  field: 'name' | 'lastMessageAt' | 'createdAt' | 'updatedAt';
  order: 'asc' | 'desc';
}

// ============================================================================
// WEBSOCKET/REALTIME TYPES
// ============================================================================

export interface MessageEvent {
  type: 'message.created' | 'message.updated' | 'message.deleted' | 'message.reaction';
  roomId: string;
  message: IMessage;
  userId: string;
}

export interface RoomEvent {
  type: 'room.created' | 'room.updated' | 'room.archived' | 'participant.added' | 'participant.removed';
  room: Room;
  userId: string;
  participant?: RoomParticipant;
}

export interface TypingEvent {
  roomId: string;
  userId: string;
  isTyping: boolean;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface MessageError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface RoomError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MESSAGE_TYPES = Object.values(MessageType);
export const ROOM_TYPES = Object.values(RoomType);
export const PERMISSION_TYPES = Object.values(PermissionType);

export const DEFAULT_MESSAGE_LIMIT = 50;
export const DEFAULT_ROOM_LIMIT = 20;
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
];

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isMessageType(value: string): value is MessageType {
  return Object.values(MessageType).includes(value as MessageType);
}

export function isRoomType(value: string): value is RoomType {
  return Object.values(RoomType).includes(value as RoomType);
}

export function isPermissionType(value: string): value is PermissionType {
  return Object.values(PermissionType).includes(value as PermissionType);
}

export function isMessageWithDetails(message: IMessage): message is MessageWithDetails {
  return 'user' in message && 'attachments' in message && 'replies' in message;
}

export function isRoomWithDetails(room: Room): room is RoomWithDetails {
  return 'participants' in room && Array.isArray(room.participants);
}