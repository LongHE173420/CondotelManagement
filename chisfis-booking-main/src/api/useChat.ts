// src/api/useChat.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { ChatConversation, ChatMessageDto } from '../types/chatTypes';
import axios from 'axios';

// --- CẤU HÌNH URL ---
const getBaseUrl = (): string => {
    // Nếu biến môi trường có dạng "http://localhost:7216/api", ta cắt bỏ "/api"
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:7216/api';
    return apiUrl.replace(/\/api\/?$/, '');
};

const BASE_URL = getBaseUrl();
const API_URL = `${BASE_URL}/api/Chat`;
// Lưu ý: Kiểm tra lại backend của bạn mapHub là "/chatHub" hay "/hubs/chat". 
// Dựa trên code cũ bạn gửi thì có vẻ là "/hubs/chat" hoặc "/chatHub". 
// Tôi để mặc định theo chuẩn thường dùng, nếu lỗi 404 hãy đổi lại thành `${BASE_URL}/hubs/chat`
const HUB_URL = `${BASE_URL}/hubs/chat`;

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
                    console.log('✅ SignalR Connected to:', HUB_URL);
                    setIsConnected(true);
                }
            } catch (err) {
                console.error('❌ SignalR Connection Error:', err);
                // Có thể retry logic ở đây nếu muốn
            }
        };

        startConnection();

        // Xử lý sự kiện nhận tin nhắn mới


        connection.on('ReceiveMessage', (messageDto: ChatMessageDto) => {
            // A. Cập nhật danh sách tin nhắn
            setMessages(prev => {
                // 1. Nếu tin nhắn này ĐÃ CÓ ID THẬT trong list rồi -> Bỏ qua (chống trùng tuyệt đối)
                if (prev.some(m => m.messageId === messageDto.messageId && m.messageId !== 0)) {
                    return prev;
                }

                // 2. Tìm tin nhắn giả lập (Optimistic) để THAY THẾ
                // (Tìm tin có ID=0, cùng nội dung, cùng người gửi, lệch giờ < 5s)
                const optimisticIndex = prev.findIndex(m =>
                    (m.messageId === 0 || !m.messageId) && // Tin giả thường ID = 0
                    m.content === messageDto.content &&
                    m.senderId === messageDto.senderId &&
                    Math.abs(new Date(m.sentAt).getTime() - new Date(messageDto.sentAt).getTime()) < 5000
                );

                if (optimisticIndex !== -1) {
                    // ✅ TÌM THẤY: Thay thế tin giả bằng tin thật (để cập nhật ID chuẩn)
                    const newMsgs = [...prev];
                    newMsgs[optimisticIndex] = messageDto;
                    return newMsgs;
                }

                // 3. Nếu không phải tin mình vừa gửi -> Thêm mới vào cuối
                const newMsgs = [...prev, messageDto];
                return newMsgs.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
            });

            // B. Cập nhật Sidebar (Logic cũ giữ nguyên)
            setConversations(prev => {
                const updated = prev.map(c => {
                    if (c.conversationId !== messageDto.conversationId) return c;
                    return {
                        ...c,
                        lastMessage: messageDto,
                        unreadCount: (messageDto.senderId !== currentUserId) ? (c as any).unreadCount + 1 : (c as any).unreadCount
                    };
                });
                return updated.sort((a, b) =>
                    new Date(b.lastMessage?.sentAt || 0).getTime() - new Date(a.lastMessage?.sentAt || 0).getTime()
                );
            });
        });

        return () => {
            connection.off('ReceiveMessage');
            connection.stop();
        };
    }, [connection, currentUserId]);

    // 3. API: Load danh sách hội thoại
    const loadConversations = useCallback(async () => {
        if (currentUserId <= 0) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<ChatConversation[]>(`${API_URL}/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);

            // Map unread counts
            const counts: Record<number, number> = {};
            res.data.forEach((conv) => {
                counts[conv.conversationId] = conv.unreadCount || 0;
            });
            setUnreadCounts(counts);

        } catch (err) {
            console.error("Load conversations failed:", err);
        }
    }, [currentUserId]);

    // 4. API: Load tin nhắn của 1 hội thoại
    const loadMessages = useCallback(async (conversationId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<ChatMessageDto[]>(`${API_URL}/messages/${conversationId}?take=100`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Sắp xếp tăng dần theo thời gian (cũ trên, mới dưới)
            const sorted = res.data.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
            setMessages(sorted);
        } catch (err) {
            console.error("Load messages failed:", err);
        }
    }, []);

    // 5. Gửi tin nhắn
    // Trong file src/api/useChat.ts

    const sendMessage = async (conversationId: number, content: string) => {
        // Kiểm tra kỹ: Phải có connection VÀ trạng thái phải là Connected
        if (connection && connection.state === HubConnectionState.Connected) {
            try {
                await connection.invoke("SendMessage", conversationId, content);
            } catch (err) {
                console.error("Send failed:", err);
                // Có thể thêm logic retry hoặc thông báo toast error ở đây
            }
        } else {
            console.warn("⚠️ SignalR chưa sẵn sàng. Đang thử kết nối lại...");

            // Logic tự động reconnect nếu bị rớt mạng (Optional)
            try {
                if (connection && connection.state === HubConnectionState.Disconnected) {
                    await connection.start();
                    await connection.invoke("SendMessage", conversationId, content); // Gửi lại sau khi connect
                } else {
                    alert("Mất kết nối máy chủ. Vui lòng tải lại trang.");
                }
            } catch (e) {
                console.error("Reconnect failed:", e);
            }
        }
    };

    // 6. QUAN TRỌNG: Mở chat với User bất kỳ (Logic cho nút "Nhắn tin" ở trang Detail)
    const openChatWithUser = async (targetUserId: number) => {
        if (!connection || !isConnected) return;
        try {
            // a. Lấy hoặc tạo ConversationId từ Server
            const convId = await connection.invoke('GetOrCreateDirectConversation', targetUserId);

            // b. Join group chat
            await connection.invoke('JoinConversation', convId);

            // c. Load lịch sử tin nhắn
            await loadMessages(convId);

            // d. Set state hiển thị
            setCurrentConvId(convId);

            // e. Refresh lại sidebar để thấy hội thoại mới
            await loadConversations();

        } catch (err) {
            console.error("Error opening chat with user:", err);
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
        loadMessages, // Export hàm này để dùng bên ngoài nếu cần
        sendMessage,
        openChatWithUser, // Hàm quan trọng mới
        isConnected,
        connection
    };
};