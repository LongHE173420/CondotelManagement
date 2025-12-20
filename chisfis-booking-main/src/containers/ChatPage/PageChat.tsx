// src/containers/ChatPage/PageChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useChat } from '../../api/useChat';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { ChatMessageDto } from '../../types/chatTypes';

const ADMIN_ID = 1;

// Helper lấy user hiện tại từ Token
const useCurrentUser = () => {
    const token = localStorage.getItem('token');
    if (!token) return { userId: 0, name: "Guest" };
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = Number(payload.nameid || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || 0);
        const rawName = payload.email || payload.unique_name || "User";
        return { userId, name: rawName };
    } catch {
        return { userId: 0, name: "Guest" };
    }
};

const PageChat: React.FC = () => {
    const { userId: currentUserId } = useCurrentUser();
    const { user, isAdmin } = useAuth();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Nhận targetUserId từ query parameter (hostId) hoặc state
    const hostIdFromQuery = searchParams.get('hostId');
    const initialTargetId = hostIdFromQuery || location.state?.targetUserId;
    const initialTargetName = location.state?.targetName || "Người dùng";

    const {
        conversations,
        messages,
        setMessages,
        currentConvId,
        setCurrentConvId,
        loadConversations,
        loadMessages,
        sendMessage,
        openChatWithUser,
        isConnected
    } = useChat(currentUserId);

    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // === THÊM DÒNG NÀY ĐỂ NGĂN SPAM ===
    const hasAutoOpenedRef = useRef(false);

    // Auto scroll xuống cuối khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Load danh sách hội thoại khi vào trang
    useEffect(() => {
        if (currentUserId > 0) {
            loadConversations();
        }
    }, [currentUserId, loadConversations]);

    // === ĐOẠN ĐÃ SỬA: CHỈ MỞ CHAT 1 LẦN DUY NHẤT ===
    useEffect(() => {
        if (
            isConnected &&
            initialTargetId &&
            currentUserId > 0 &&
            !hasAutoOpenedRef.current  // ← Ngăn chạy lại nhiều lần
        ) {
            const targetId = Number(initialTargetId);
            if (targetId !== currentUserId && !isNaN(targetId)) {
                console.log("Auto opening chat with:", targetId);
                openChatWithUser(targetId);
                hasAutoOpenedRef.current = true; // ← Đánh dấu đã mở rồi

                // Xóa query parameter để tránh trigger lại khi F5 hoặc back
                if (hostIdFromQuery) {
                    window.history.replaceState({}, document.title, '/chat');
                }
            }
        }
    }, [isConnected, initialTargetId, currentUserId, hostIdFromQuery, openChatWithUser]);

    // Xử lý khi chọn hội thoại từ Sidebar
    const handleSelectConversation = async (convId: number) => {
        setCurrentConvId(convId);
        await loadMessages(convId);
    };

    const handleSend = () => {
        // Kiểm tra đầu vào
        if (!inputText.trim() || !currentConvId) return;

        const contentToSend = inputText.trim();

        // A. Tạo tin nhắn giả lập để hiện ngay lập tức (Optimistic UI)
        const optimisticMessage: any = {
            messageId: 0,
            conversationId: currentConvId,
            senderId: currentUserId,
            content: contentToSend,
            sentAt: new Date().toISOString(),
            isRead: false
        };

        // B. Cập nhật giao diện NGAY LẬP TỨC
        setMessages((prev) => [...prev, optimisticMessage]);

        // C. Gửi xuống server
        sendMessage(currentConvId, contentToSend);

        // D. Xóa ô nhập liệu
        setInputText("");
    };

    // Helper: Format thời gian
    const formatTime = (utcTime: string) => {
        if (!utcTime) return "";
        return new Date(utcTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPartnerName = (conv: any) => {
        if (!conv) return "Hỗ trợ khách hàng";
        if (conv.otherUser && conv.otherUser.fullName) {
            return conv.otherUser.fullName;
        }
        const partnerId = conv.userAId === currentUserId ? conv.userBId : conv.userAId;
        return partnerId === ADMIN_ID ? "Hỗ trợ khách hàng" : `User ${partnerId}`;
    };

    const getPartnerImage = (conv: any) => {
        if (!conv) return null;
        if (conv.otherUser && conv.otherUser.imageUrl) {
            return conv.otherUser.imageUrl;
        }
        return null;
    };

    const getSenderName = (msg: any) => {
        if (msg.sender && msg.sender.fullName) {
            return msg.sender.fullName;
        }
        return msg.senderId === currentUserId ? "Bạn" : `User ${msg.senderId}`;
    };

    const getSenderImage = (msg: any) => {
        if (msg.sender && msg.sender.imageUrl) {
            return msg.sender.imageUrl;
        }
        return null;
    };

    const currentConv = conversations.find(c => c.conversationId === currentConvId);

    if (currentUserId <= 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-xl text-gray-600">Vui lòng đăng nhập để sử dụng tính năng chat.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">
                    {isAdmin ? "Hỗ trợ khách hàng - Admin" : "Hỗ trợ khách hàng"}
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[75vh]">

                    {/* --- LEFT SIDEBAR: DANH SÁCH --- */}
                    <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                        <div className="p-4 border-b bg-blue-600 text-white font-bold text-lg">
                            Danh sách
                        </div>

                        {!isAdmin && currentUserId !== ADMIN_ID && (
                            <div className="p-4 border-b">
                                <button
                                    onClick={() => openChatWithUser(ADMIN_ID)}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
                                >
                                    Chat với hỗ trợ
                                </button>
                            </div>
                        )}
                        {isAdmin && (
                            <div className="p-4 border-b bg-blue-50">
                                <p className="text-sm text-blue-700 font-semibold text-center">
                                    👨‍💼 Bạn đang ở chế độ Admin - Hỗ trợ khách hàng
                                </p>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <p className="text-center text-gray-400 py-10">Chưa có tin nhắn nào</p>
                            ) : (
                                conversations.map(conv => {
                                    const partnerImage = getPartnerImage(conv);
                                    return (
                                        <div
                                            key={conv.conversationId}
                                            onClick={() => handleSelectConversation(conv.conversationId)}
                                            className={`p-4 border-b cursor-pointer transition-all ${currentConvId === conv.conversationId
                                                ? 'bg-blue-50 border-l-4 border-blue-600'
                                                : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {partnerImage ? (
                                                    <img
                                                        src={partnerImage}
                                                        alt={getPartnerName(conv)}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                                        {getPartnerName(conv).charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-800 truncate">
                                                        {getPartnerName(conv)}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate mt-1">
                                                        {conv.lastMessage?.content || "Bắt đầu trò chuyện"}
                                                    </p>
                                                </div>
                                                {conv.unreadCount && conv.unreadCount > 0 && (
                                                    <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Khu vực chat chính */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-xl h-[720px] flex flex-col overflow-hidden">
                            {currentConvId ? (
                                <>
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
                                        <div className="flex items-center gap-4">
                                            {getPartnerImage(currentConv) ? (
                                                <img
                                                    src={getPartnerImage(currentConv)!}
                                                    alt={getPartnerName(currentConv)}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-semibold text-xl">
                                                    {getPartnerName(currentConv).charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <h2 className="text-2xl font-bold">{getPartnerName(currentConv)}</h2>
                                        </div>
                                    </div>

                                    {/* Tin nhắn */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50">
                                        {messages.length === 0 ? (
                                            <p className="text-center text-gray-400">Chưa có tin nhắn, hãy bắt đầu cuộc trò chuyện!</p>
                                        ) : (
                                            messages.map(msg => {
                                                const isMine = msg.senderId === currentUserId;
                                                const senderImage = getSenderImage(msg);
                                                return (
                                                    <div
                                                        key={msg.messageId || `${msg.sentAt}-${msg.senderId}`}
                                                        className={`flex gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        {!isMine && (
                                                            <div className="flex-shrink-0">
                                                                {senderImage ? (
                                                                    <img
                                                                        src={senderImage}
                                                                        alt={getSenderName(msg)}
                                                                        className="w-10 h-10 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">
                                                                        {getSenderName(msg).charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                                            {!isMine && (
                                                                <span className="text-xs text-gray-500 mb-1 px-2">
                                                                    {getSenderName(msg)}
                                                                </span>
                                                            )}
                                                            <div
                                                                className={`px-5 py-3 rounded-3xl shadow-md ${isMine
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-white text-gray-800 border border-gray-200'
                                                                    }`}
                                                            >
                                                                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                                                                <p className={`text-xs mt-2 opacity-70 ${isMine ? 'text-right' : 'text-left'}`}>
                                                                    {new Date(msg.sentAt).toLocaleTimeString('vi-VN', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {isMine && (
                                                            <div className="flex-shrink-0">
                                                                {senderImage ? (
                                                                    <img
                                                                        src={senderImage}
                                                                        alt={getSenderName(msg)}
                                                                        className="w-10 h-10 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                                                                        {getSenderName(msg).charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input gửi tin nhắn */}
                                    <div className="p-5 border-t bg-white">
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                                placeholder="Aa..."
                                                className="flex-1 px-6 py-4 border border-gray-300 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition text-base"
                                            />
                                            <button
                                                onClick={handleSend}
                                                disabled={!inputText.trim()}
                                                className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg"
                                            >
                                                Gửi
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <p className="text-lg">Chọn một cuộc hội thoại để bắt đầu</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageChat;