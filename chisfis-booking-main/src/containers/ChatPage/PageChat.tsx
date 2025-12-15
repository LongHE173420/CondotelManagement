// src/containers/ChatPage/PageChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '../../api/useChat';

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
    const location = useLocation(); // Hook lấy dữ liệu điều hướng

    // Nhận targetUserId từ trang Detail (nếu có)
    const initialTargetId = location.state?.targetUserId;
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

    // --- LOGIC MỚI: TỰ ĐỘNG MỞ CHAT TỪ TRANG DETAIL ---
    useEffect(() => {
        // Chỉ chạy khi đã kết nối SignalR thành công và có targetId từ router
        if (isConnected && initialTargetId && currentUserId > 0) {
            // Không tự chat với chính mình
            if (Number(initialTargetId) !== currentUserId) {
                console.log("Auto opening chat with:", initialTargetId);
                openChatWithUser(Number(initialTargetId));

                // (Optional) Xóa state history để F5 không bị trigger lại logic này
                window.history.replaceState({}, document.title);
            }
        }
    }, [isConnected, initialTargetId, currentUserId]); // Bỏ openChatWithUser ra khỏi deps để tránh loop

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
        // Lưu ý: Cấu trúc này phải khớp với những gì useChat đang check trùng lặp (content, senderId, sentAt)
        const optimisticMessage: any = {
            messageId: 0, // ID tạm bằng 0 hoặc null
            conversationId: currentConvId,
            senderId: currentUserId,
            content: contentToSend,
            sentAt: new Date().toISOString(), // Thời gian hiện tại
            isRead: false
        };

        // B. Cập nhật giao diện NGAY LẬP TỨC
        setMessages((prev) => [...prev, optimisticMessage]);

        // C. Gửi xuống server (Server sẽ lưu và bắn socket lại)
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

    // Helper: Lấy tên người chat cùng để hiển thị trên Header
    const getPartnerName = (convId: number) => {
        const conv = conversations.find(c => c.conversationId === convId);
        if (conv) return conv.otherUserName || "Người dùng";
        // Fallback: nếu chưa load kịp list mà đang chat với user từ trang Detail
        if (initialTargetId && Number(initialTargetId) !== currentUserId) return initialTargetName;
        return "Đang tải...";
    };

    if (currentUserId <= 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-xl text-gray-600">Vui lòng đăng nhập để sử dụng tính năng chat.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Hệ thống tin nhắn</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[75vh]">

                    {/* --- LEFT SIDEBAR: DANH SÁCH --- */}
                    <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                        <div className="p-4 border-b bg-blue-600 text-white font-bold text-lg">
                            Danh sách
                        </div>

                        {/* Nút Chat với Admin (nếu không phải là Admin) */}
                        {currentUserId !== ADMIN_ID && (
                            <div className="p-3 border-b bg-blue-50">
                                <button
                                    onClick={() => openChatWithUser(ADMIN_ID)}
                                    className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm"
                                >
                                    💬 Hỗ trợ khách hàng
                                </button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <p className="text-center text-gray-400 py-10">Chưa có cuộc hội thoại nào.</p>
                            ) : (
                                conversations.map(conv => (
                                    <div
                                        key={conv.conversationId}
                                        onClick={() => handleSelectConversation(conv.conversationId)}
                                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${currentConvId === conv.conversationId ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                            }`}
                                    >
                                        <div className="font-semibold text-gray-800">
                                            {conv.otherUserName || "Unknown"}
                                        </div>
                                        <div className="text-sm text-gray-500 truncate mt-1">
                                            {conv.lastMessage?.content || "..."}
                                        </div>
                                        <div className="text-xs text-gray-400 text-right mt-1">
                                            {formatTime(conv.lastMessage?.sentAt as string)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* --- RIGHT CONTENT: KHUNG CHAT --- */}
                    <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                        {currentConvId ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b bg-white shadow-sm flex items-center justify-between z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {getPartnerName(currentConvId).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg text-gray-800">{getPartnerName(currentConvId)}</h2>
                                            <span className="text-xs text-green-500 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                    {messages.map((msg, index) => {
                                        const isMine = msg.senderId === currentUserId;
                                        return (
                                            <div key={index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-sm relative group ${isMine ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                                                        {formatTime(msg.sentAt as string)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t">
                                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-transparent focus:outline-none py-2 text-gray-700"
                                            placeholder="Nhập tin nhắn..."
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!inputText.trim()}
                                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-lg">Chọn một cuộc hội thoại để bắt đầu</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageChat;