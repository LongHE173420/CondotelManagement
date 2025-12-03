// src/containers/ChatPage/PageChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../api/useChat';
import axios from 'axios';
import { ChatMessageDto } from '../../types/chatTypes';

const ADMIN_ID = 1;
const API_URL = "https://localhost:7216/api/Chat";

const useCurrentUser = () => {
    const token = localStorage.getItem('token');
    if (!token) return { userId: 0, name: "Guest" };

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = Number(payload.nameid || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || 0);
        const rawName = payload.email || payload.unique_name || "User";
        const name = rawName.includes('@') ? rawName.split('@')[0] : rawName;
        return { userId, name };
    } catch {
        return { userId: 0, name: "Guest" };
    }
};

const PageChat: React.FC = () => {
    const { userId: currentUserId } = useCurrentUser();

    const {
        conversations,
        messages,
        currentConvId,
        setCurrentConvId,
        setMessages,
        loadConversations,
        openChatWithUser,
        sendMessage,
        connection,
        isConnected
    } = useChat(currentUserId);

    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto scroll xuống cuối khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Load danh sách cuộc trò chuyện khi đăng nhập
    useEffect(() => {
        if (currentUserId > 0) {
            loadConversations();
        }
    }, [currentUserId, loadConversations]);

    // Tham gia lại room khi chọn cuộc trò chuyện
    useEffect(() => {
        if (isConnected && connection && currentConvId) {
            connection.invoke("JoinConversation", currentConvId).catch(err =>
                console.error("Lỗi JoinConversation:", err)
            );
        }
    }, [isConnected, connection, currentConvId]);

    // Load tin nhắn khi chọn cuộc trò chuyện
    const loadMessagesForConv = async (convId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<ChatMessageDto[]>(
                `${API_URL}/messages/${convId}?take=100`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const sorted = res.data.sort((a, b) =>
                new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
            );
            setMessages(sorted);
        } catch (err) {
            console.error("Lỗi load tin nhắn:", err);
            setMessages([]);
        }
    };

    const handleSelectConversation = async (conv: any) => {
        setCurrentConvId(conv.conversationId);
        await loadMessagesForConv(conv.conversationId);
    };

    const handleSend = () => {
        if (!inputText.trim() || !currentConvId) return;
        sendMessage(currentConvId, inputText.trim());
        setInputText(""); // Xóa input ngay lập tức (tin nhắn sẽ được server đẩy về)
    };

    if (currentUserId <= 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-xl text-gray-600">Vui lòng đăng nhập để sử dụng chat</div>
            </div>
        );
    }

    const getPartnerName = (conv: any) => {
        if (!conv) return "Hỗ trợ khách hàng";
        const partnerId = conv.userAId === currentUserId ? conv.userBId : conv.userAId;
        return partnerId === ADMIN_ID ? "Hỗ trợ khách hàng" : `User ${partnerId}`;
    };

    const currentConv = conversations.find(c => c.conversationId === currentConvId);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Hỗ trợ khách hàng</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar - Danh sách cuộc trò chuyện */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl h-[720px] flex flex-col overflow-hidden">
                            <div className="p-5 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                                <h2 className="text-xl font-bold">Tin nhắn</h2>
                            </div>

                            {currentUserId !== ADMIN_ID && (
                                <div className="p-4 border-b">
                                    <button
                                        onClick={() => openChatWithUser(ADMIN_ID)}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
                                    >
                                        Chat với hỗ trợ
                                    </button>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto">
                                {conversations.length === 0 ? (
                                    <p className="text-center text-gray-400 py-10">Chưa có tin nhắn nào</p>
                                ) : (
                                    conversations.map(conv => (
                                        <div
                                            key={conv.conversationId}
                                            onClick={() => handleSelectConversation(conv)}
                                            className={`p-4 border-b cursor-pointer transition-all ${currentConvId === conv.conversationId
                                                ? 'bg-blue-50 border-l-4 border-blue-600'
                                                : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="font-semibold text-gray-800">
                                                {getPartnerName(conv)}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate mt-1">
                                                {conv.lastMessage?.content || "Bắt đầu trò chuyện"}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Khu vực chat chính */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-xl h-[720px] flex flex-col overflow-hidden">
                            {currentConvId ? (
                                <>
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
                                        <h2 className="text-2xl font-bold">{getPartnerName(currentConv)}</h2>
                                    </div>

                                    {/* Tin nhắn */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50">
                                        {messages.length === 0 ? (
                                            <p className="text-center text-gray-400">Chưa có tin nhắn, hãy bắt đầu cuộc trò chuyện!</p>
                                        ) : (
                                            messages.map(msg => {
                                                const isMine = msg.senderId === currentUserId;
                                                return (
                                                    <div
                                                        key={msg.messageId || `${msg.sentAt}-${msg.senderId}`}
                                                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div
                                                            className={`max-w-[75%] px-5 py-3 rounded-3xl shadow-md ${isMine
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-white text-gray-800 border border-gray-200'
                                                                }`}
                                                        >
                                                            <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                                                            <p className={`text-xs mt-2 opacity-70 text-right`}>
                                                                {new Date(msg.sentAt).toLocaleTimeString('vi-VN', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
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
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-2xl text-gray-400">Chọn một cuộc trò chuyện để bắt đầu</p>
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