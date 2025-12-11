// src/api/useChat.ts
import { useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { ChatConversation, ChatMessageDto } from '../types/chatTypes';
import axios from 'axios';
import logger from 'utils/logger';

// Lấy base URL từ environment variable (giống như axiosClient.ts)
// REACT_APP_API_URL thường có dạng: http://localhost:7216/api hoặc https://api.example.com/api
// Ta cần lấy phần base (bỏ /api) để tạo HUB_URL và API_URL
const getBaseUrl = (): string => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:7216/api';
  // Nếu REACT_APP_API_URL có /api ở cuối, bỏ nó đi để lấy base URL
  const baseUrl = apiUrl.replace(/\/api\/?$/, '');
  return baseUrl;
};

const BASE_URL = getBaseUrl();
const API_URL = `${BASE_URL}/api/Chat`;
const HUB_URL = `${BASE_URL}/hubs/chat`;

logger.info('🔧 Chat API URLs:', { API_URL, HUB_URL, BASE_URL });
if (!process.env.REACT_APP_API_URL) {
  logger.warn('⚠️ REACT_APP_API_URL không được set, đang dùng default URLs');
}

interface UseChatReturn {
    conversations: ChatConversation[];
    messages: ChatMessageDto[];
    currentConvId: number | null;
    unreadCounts: Record<number, number>;
    setCurrentConvId: (id: number | null) => void;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessageDto[]>>;
    loadConversations: () => Promise<void>;
    openChatWithUser: (targetUserId: number) => Promise<void>;
    sendMessage: (conversationId: number, content: string) => void;
    connection: HubConnection | null;
    isConnected: boolean;

}

export const useChat = (currentUserId: number): UseChatReturn => {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [currentConvId, setCurrentConvId] = useState<number | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
    const [isConnected, setIsConnected] = useState(false);

    const currentConvIdRef = useRef<number | null>(null);
    useEffect(() => {
        currentConvIdRef.current = currentConvId;
    }, [currentConvId]);

    // Tạo SignalR connection
    useEffect(() => {
        if (currentUserId <= 0) return;

        const newConnection = new HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => localStorage.getItem('token') || '',
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        setConnection(newConnection);

        return () => {
            newConnection.stop();
            setIsConnected(false);
        };
    }, [currentUserId]);

    // Lắng nghe tin nhắn realtime
    useEffect(() => {
        if (!connection) return;

        connection.off('ReceiveMessage'); // đảm bảo không đăng ký nhiều lần

        // 2. SỬA ReceiveMessage – THÊM KIỂM TRA TRÁNH TRÙNG + SẮP XẾP CHUẨN
        connection.on('ReceiveMessage', (messageDto: ChatMessageDto) => {
            setMessages(prev => {
                // Nếu đã có messageId thật → dùng nó để check trùng
                if (messageDto.messageId) {
                    if (prev.some(m => m.messageId === messageDto.messageId)) {
                        return prev; // đã có rồi → bỏ qua
                    }
                } else {
                    // Nếu chưa có messageId (rất hiếm), check bằng nội dung + thời gian gần giống
                    const isDup = prev.some(m =>
                        m.content === messageDto.content &&
                        m.senderId === messageDto.senderId &&
                        Math.abs(new Date(m.sentAt).getTime() - new Date(messageDto.sentAt).getTime()) < 3000
                    );
                    if (isDup) return prev;
                }

                const newMsgs = [...prev, messageDto];

                // Sắp xếp chuẩn: ưu tiên thời gian, nếu bằng thì messageId lớn hơn nằm dưới
                return newMsgs.sort((a, b) => {
                    const timeDiff = new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
                    if (timeDiff !== 0) return timeDiff;
                    return (a.messageId || 0) - (b.messageId || 0);
                });
            });

            // Cập nhật sidebar (giữ nguyên, tốt rồi)
            setConversations(prev => prev.map(c => {
                if (c.conversationId !== messageDto.conversationId) return c;
                return { ...c, lastMessage: messageDto };
            }).sort((a, b) =>
                new Date(b.lastMessage?.sentAt || 0).getTime() - new Date(a.lastMessage?.sentAt || 0).getTime()
            ));
        });





        if (connection.state === HubConnectionState.Disconnected) {
            // Trường hợp 1: Chưa kết nối -> Thì bắt đầu kết nối
            connection.start()
                .then(() => {
                    logger.info('✅ SignalR Connected!', { hubUrl: HUB_URL });
                    setIsConnected(true); // Báo ra ngoài là đã xong
                })
                .catch((err: any) => {
                    logger.error('❌ SignalR Connection Failed:', err, { hubUrl: HUB_URL });
                });
        }
        else if (connection.state === HubConnectionState.Connected) {
            // Trường hợp 2: Đã kết nối rồi (do React render lại) -> Báo luôn là true
            setIsConnected(true);
        }

        return () => {
            connection.off('ReceiveMessage');
        };
    }, [connection, currentUserId]);

    const loadConversations = async () => {
        if (currentUserId <= 0) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<any[]>(`${API_URL}/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setConversations(res.data);

            const counts: Record<number, number> = {};
            res.data.forEach((conv: any) => {
                counts[conv.conversationId] = conv.unreadCount || 0;
            });
            setUnreadCounts(counts);
        } catch (err: any) {
            logger.error('Load conversations error:', err.response?.data || err.message, { apiUrl: API_URL });
        }
    };
    const loadMessages = async (conversationId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<ChatMessageDto[]>(
                `${API_URL}/messages/${conversationId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // SẮP XẾP THEO THỜI GIAN TĂNG ĐỂ UI KHÔNG LOẠN
            const sorted = res.data.sort((a, b) => {
                const timeA = new Date(a.sentAt).getTime();
                const timeB = new Date(b.sentAt).getTime();
                if (timeA !== timeB) return timeA - timeB;
                return (a.messageId || 0) - (b.messageId || 0);
            });

            setMessages(sorted);
        } catch (err: any) {
            logger.error("Load messages error:", err.response?.data || err.message, { conversationId });
        }
    };


    const openChatWithUser = async (targetUserId: number) => {
        if (!connection || currentUserId <= 0) return;

        try {
            const convId = await connection.invoke('GetOrCreateDirectConversation', targetUserId) as number;

            setCurrentConvId(convId);
            setUnreadCounts(prev => ({ ...prev, [convId]: 0 }));

            // 1) Load lịch sử tin nhắn
            await loadMessages(convId);

            // 2) Join phòng sau khi load_messages
            if (connection.state === HubConnectionState.Connected) {
                await connection.invoke('JoinConversation', convId);
            }

        } catch (err) {
            logger.error('Open chat error:', err, { targetUserId, currentUserId });
        }
    };



    // 1. SỬA HÀM sendMessage – KHÔNG THÊM TEMP MESSAGE NỮA
    const sendMessage = (conversationId: number, content: string) => {
        if (!connection || connection.state !== HubConnectionState.Connected) {
            logger.error("SignalR not connected!", { connectionState: connection?.state });
            return;
        }
        if (!content.trim()) return;

        // ĐÃ BỎ DÒNG NÀY: không thêm tempMessage nữa
        // setMessages(prev => [...prev, tempMessage]);

        connection.invoke("SendMessage", conversationId, content.trim())
            .catch((err: any) => {
                logger.error("Send message error:", err, { conversationId, contentLength: content.length });
                alert("Gửi tin nhắn thất bại, vui lòng thử lại!");
            });
    };


    return {
        conversations,
        messages,
        currentConvId,
        unreadCounts,
        setCurrentConvId,
        setMessages,
        loadConversations,
        openChatWithUser,
        sendMessage,
        connection,
        isConnected
    };
};