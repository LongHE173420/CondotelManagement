// src/api/useChat.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { ChatConversation, ChatMessageDto } from '../types/chatTypes';
import axios from 'axios';
import { toastError } from 'utils/toast'; // Nếu bạn có toastError, nếu không thì thay bằng console.error

// --- CẤU HÌNH URL ---
const getBaseUrl = (): string => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:7216/api';
    return apiUrl.replace(/\/api\/?$/, '');
};

const BASE_URL = getBaseUrl();
const API_URL = `${BASE_URL}/api/Chat`;
const HUB_URL = `${BASE_URL}/hubs/chat`; // Điều chỉnh nếu backend dùng /chatHub hoặc khác

export const useChat = (currentUserId: number) => {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [currentConvId, setCurrentConvId] = useState<number | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
    const [isConnected, setIsConnected] = useState(false);

    // 1. Khởi tạo SignalR Connection
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
    }, [currentUserId]);

    // 2. KẾT NỐI VÀ LẮNG NGHE SỰ KIỆN
    useEffect(() => {
        if (!connection) return;

        const startConnection = async () => {
            try {
                if (connection.state === HubConnectionState.Disconnected) {
                    await connection.start();
                    setIsConnected(true);
                }
            } catch (err) {
                // Có thể retry logic ở đây nếu muốn
            }
        };

        startConnection();

        connection.on('ReceiveMessage', (messageDto: ChatMessageDto) => {
            setMessages(prev => {
                if (prev.some(m => m.messageId === messageDto.messageId && m.messageId !== 0)) {
                    return prev;
                }

                const optimisticIndex = prev.findIndex(m =>
                    (m.messageId === 0 || !m.messageId) &&
                    m.content === messageDto.content &&
                    m.senderId === messageDto.senderId &&
                    Math.abs(new Date(m.sentAt).getTime() - new Date(messageDto.sentAt).getTime()) < 5000
                );

                if (optimisticIndex !== -1) {
                    const newMsgs = [...prev];
                    newMsgs[optimisticIndex] = messageDto;
                    return newMsgs;
                }

                const newMsgs = [...prev, messageDto];
                return newMsgs.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
            });

            setConversations(prev => {
                const updated = prev.map(c => {
                    if (c.conversationId !== messageDto.conversationId) return c;
                    return {
                        ...c,
                        lastMessage: messageDto,
                        unreadCount: (messageDto.senderId !== currentUserId)
                            ? (c.unreadCount || 0) + 1
                            : c.unreadCount || 0
                    };
                });
                return updated.sort((a, b) =>
                    new Date(b.lastMessage?.sentAt || 0).getTime() - new Date(a.lastMessage?.sentAt || 0).getTime()
                );
            });
        });

        return () => {
            connection.off('ReceiveMessage');
            if (connection.state === HubConnectionState.Connected) {
                connection.stop();
            }
        };
    }, [connection, currentUserId]);

    // 3. Load danh sách hội thoại
    const loadConversations = useCallback(async () => {
        if (currentUserId <= 0) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<ChatConversation[]>(`${API_URL}/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);

            const counts: Record<number, number> = {};
            res.data.forEach((conv) => {
                counts[conv.conversationId] = conv.unreadCount || 0;
            });
            setUnreadCounts(counts);
        } catch (err) {
        }
    }, [currentUserId]);

    // 4. Load tin nhắn của 1 hội thoại
    const loadMessages = useCallback(async (conversationId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<ChatMessageDto[]>(`${API_URL}/messages/${conversationId}?take=100`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const sorted = res.data.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
            setMessages(sorted);
        } catch (err) {
        }
    }, []);

    // 5. Gửi tin nhắn
    const sendMessage = async (conversationId: number, content: string) => {
        if (connection && connection.state === HubConnectionState.Connected) {
            try {
                await connection.invoke("SendMessage", conversationId, content);
            } catch (err) {
                // Có thể thêm logic retry hoặc thông báo toast error ở đây
            }
        } else {

            // Logic tự động reconnect nếu bị rớt mạng (Optional)
            try {
                if (connection && connection.state === HubConnectionState.Disconnected) {
                    await connection.start();
                    await connection.invoke("SendMessage", conversationId, content);
                }
            } catch (e) {
            }
        }
    };

    // 6. MỚI: Mở chat với host của một condotel (dùng condotelId)
    const openChatWithCondotelHost = async (condotelId: number, initialMessage?: string) => {
        if (!connection || connection.state !== HubConnectionState.Connected) {
            toastError("Đang kết nối chat, vui lòng thử lại trong giây lát");
            return false;
        }

        const defaultMessage = initialMessage || "Xin chào, tôi quan tâm đến căn hộ của bạn.";

        try {
            const token = localStorage.getItem('token');

            // Định nghĩa kiểu trả về từ backend
            interface SendToHostResponse {
                conversationId: number;
            }

            // Gửi request và khai báo kiểu generic để TypeScript biết cấu trúc data
            const response = await axios.post<SendToHostResponse>(
                `${API_URL}/messages/send-to-host`,
                {
                    condotelId,
                    content: defaultMessage
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Bây giờ TS biết response.data có thuộc tính conversationId → không còn lỗi TS2571
            const conversationId = response.data.conversationId;

            if (!conversationId || typeof conversationId !== 'number') {
                throw new Error("Không nhận được conversationId hợp lệ từ server");
            }

            // Join room realtime
            await connection.invoke('JoinConversation', conversationId);

            // Load tin nhắn của conversation mới
            await loadMessages(conversationId);

            // Set làm conversation hiện tại
            setCurrentConvId(conversationId);

            // Refresh sidebar để hiển thị conversation mới + last message
            await loadConversations();

            return true;

        } catch (err: any) {
            console.error("Lỗi mở chat với host:", err);

            // Xử lý lỗi chi tiết hơn
            let msg = "Không thể mở chat với host";
            if (err.response?.data) {
                // Backend trả lỗi dạng { error: "..." } hoặc { message: "..." }
                msg = err.response.data.error || err.response.data.message || msg;
            } else if (err.message) {
                msg = err.message;
            }

            toastError(msg);
            return false;
        }
    };

    // 7. Mở chat trực tiếp với user (cũ, vẫn giữ lại nếu cần)
    const openChatWithUser = async (targetUserId: number) => {
        if (!connection || !isConnected) return;
        try {
            const convId = await connection.invoke('GetOrCreateDirectConversation', targetUserId);
            await connection.invoke('JoinConversation', convId);
            await loadMessages(convId);
            setCurrentConvId(convId);
            await loadConversations();
        } catch (err) {
        }
    };

    return {
        conversations,
        messages,
        currentConvId,
        unreadCounts,
        setCurrentConvId,
        setMessages,
        loadConversations,
        loadMessages,
        sendMessage,
        openChatWithUser,
        openChatWithCondotelHost,   // Hàm mới quan trọng
        isConnected,
        connection
    };
};