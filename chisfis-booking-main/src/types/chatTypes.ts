// src/types/chatTypes.ts

export interface ChatUser {
    userId: number;
    fullName: string;
    imageUrl?: string | null;
}

export interface ChatMessage {
    messageId?: number;
    conversationId: number;
    senderId: number;
    content: string;
    sentAt: string | Date; // API trả về string, nhưng có thể convert sang Date
}

export interface ChatLastMessage {
    content: string;
    sentAt: string;
    senderId: number;
}

export interface ChatConversation {
    conversationId: number;
    name?: string;
    conversationType?: string;
    lastMessage?: ChatLastMessage;
    userAId?: number;
    userBId?: number;
    otherUserName?: string;
    unreadCount?: number;
}

export interface ChatMessageDto {
    messageId?: number;
    conversationId: number;
    senderId: number;
    sender?: ChatUser; // Thông tin người gửi
    content: string;
    sentAt: string;
}