import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import blogAPI, { BlogRequestDTO } from 'api/blog';
import { toast } from 'react-toastify';

const ITEMS_PER_PAGE = 5;

const AdminBlogRequests = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<BlogRequestDTO[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Modal Từ chối
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    // Modal Chi tiết bài viết
    const [selectedPost, setSelectedPost] = useState<BlogRequestDTO | null>(null);

    // Modal Xác nhận duyệt bài
    const [approveConfirmId, setApproveConfirmId] = useState<number | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await blogAPI.adminGetPendingRequests();
            setRequests(data);
        } catch (error) {
            toast.error("Không thể tải danh sách yêu cầu.");
        } finally {
            setLoading(false);
        }
    };

    // --- XỬ LÝ DUYỆT BÀI ---
    const openApproveConfirm = (id: number) => {
        setApproveConfirmId(id);
    };

    const confirmApprove = async () => {
        if (!approveConfirmId) return;

        try {
            await blogAPI.adminApproveRequest(approveConfirmId);
            toast.success("Duyệt bài thành công!");
            setRequests(prev => prev.filter(req => req.blogRequestId !== approveConfirmId));
            if (selectedPost?.blogRequestId === approveConfirmId) setSelectedPost(null);
        } catch (error) {
            toast.error("Có lỗi xảy ra khi duyệt bài.");
        } finally {
            setApproveConfirmId(null);
        }
    };

    // --- XỬ LÝ TỪ CHỐI ---
    const openRejectModal = (id: number) => {
        setSelectedRequestId(id);
        setRejectReason("");
        setIsRejectModalOpen(true);
    };

    const submitReject = async () => {
        if (!selectedRequestId) return;
        if (rejectReason.trim() === "") {
            toast.warning("Vui lòng nhập lý do từ chối!");
            return;
        }

        try {
            await blogAPI.adminRejectRequest(selectedRequestId, rejectReason);
            toast.success("Đã từ chối bài viết.");
            setRequests(prev => prev.filter(req => req.blogRequestId !== selectedRequestId));
            setIsRejectModalOpen(false);
            if (selectedPost?.blogRequestId === selectedRequestId) setSelectedPost(null);
        } catch (error) {
            toast.error("Có lỗi xảy ra khi từ chối bài.");
        }
    };

    // --- FILTER & PAGINATION ---
    const filteredRequests = requests.filter(req =>
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.hostName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Quay lại Dashboard
                </button>

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Yêu cầu duyệt Blog</h1>
                            <p className="text-gray-600 mt-2">Quản lý và phê duyệt bài viết từ Host</p>
                        </div>
                        <div className="text-2xl font-bold text-indigo-600 bg-indigo-50 px-6 py-3 rounded-xl">
                            {requests.length} yêu cầu chờ duyệt
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                    <div className="relative max-w-lg">
                        <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm theo tiêu đề hoặc tên Host..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                            <p className="mt-4 text-gray-500">Đang tải yêu cầu...</p>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có yêu cầu nào</h3>
                            <p className="text-gray-500">Hiện tại chưa có bài viết nào đang chờ duyệt.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Host</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bài viết</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Danh mục</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ngày gửi</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentItems.map((req) => (
                                            <tr key={req.blogRequestId} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                                            {req.hostName?.charAt(0).toUpperCase() || 'U'}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="font-medium text-gray-900">{req.hostName || 'Unknown'}</div>
                                                            <div className="text-sm text-gray-500">ID: #{req.hostId}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 cursor-pointer" onClick={() => setSelectedPost(req)}>
                                                    <div className="flex items-center gap-4 group">
                                                        {req.featuredImageUrl ? (
                                                            <img
                                                                src={req.featuredImageUrl}
                                                                alt={req.title}
                                                                className="h-16 w-20 rounded-lg object-cover border border-gray-200 group-hover:border-indigo-300 transition"
                                                                onError={(e: any) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = 'https://via.placeholder.com/80x64?text=No+Image';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="h-16 w-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs">
                                                                No Image
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-semibold text-indigo-700 group-hover:text-indigo-900 transition">
                                                                {req.title}
                                                            </div>
                                                            <p className="text-sm text-gray-600 line-clamp-3 mt-1 max-w-md" title={req.content}>
                                                                {req.content || "Không có nội dung preview"}
                                                            </p>
                                                            <span className="text-xs text-indigo-600 underline opacity-0 group-hover:opacity-100 transition mt-1 inline-block">
                                                                Xem chi tiết →
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className="px-4 py-1.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                                                        {(req as any).categoryName || 'Chung'}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5 text-sm text-gray-600">
                                                    {new Date(req.requestDate).toLocaleString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>

                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openApproveConfirm(req.blogRequestId);
                                                            }}
                                                            className="p-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 hover:scale-110 transition-all duration-200 shadow-md"
                                                            title="Duyệt bài"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openRejectModal(req.blogRequestId);
                                                            }}
                                                            className="p-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 hover:scale-110 transition-all duration-200 shadow-md"
                                                            title="Từ chối"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Hiển thị {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredRequests.length)} trong {filteredRequests.length}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                                        >
                                            Trước
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`px-4 py-2 rounded-lg ${currentPage === i + 1
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'border border-gray-300 hover:bg-gray-100'
                                                    } transition`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                                        >
                                            Sau
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ===== MODAL XÁC NHẬN DUYỆT BÀI ===== */}
            {approveConfirmId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-green-100 rounded-full">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Duyệt bài viết?</h3>
                        </div>
                        <p className="text-gray-600 mb-8">
                            Bài viết sẽ được <strong>hiển thị công khai</strong> ngay sau khi duyệt.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setApproveConfirmId(null)}
                                className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 font-medium transition"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmApprove}
                                className="px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 font-medium transition shadow-lg"
                            >
                                Duyệt bài
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL TỪ CHỐI ===== */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-red-100 rounded-full">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Từ chối bài viết</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Vui lòng nhập lý do để Host biết và chỉnh sửa lại.
                        </p>
                        <textarea
                            rows={5}
                            placeholder="Ví dụ: Nội dung chưa đủ chi tiết, thiếu hình ảnh minh họa..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition"
                        />
                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 font-medium transition"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={submitReject}
                                disabled={!rejectReason.trim()}
                                className="px-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Gửi từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL CHI TIẾT BÀI VIẾT ===== */}
            {selectedPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 animate-in fade-in zoom-in duration-300">
                        <div className="relative h-64 md:h-96">
                            <img
                                src={selectedPost.featuredImageUrl || "https://via.placeholder.com/1200x600?text=No+Image"}
                                alt={selectedPost.title}
                                className="w-full h-full object-cover rounded-t-2xl"
                            />
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="absolute top-4 right-4 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedPost.title}</h2>
                            <div className="flex items-center text-gray-600 mb-6 gap-4">
                                <span className="font-medium text-indigo-600">{selectedPost.hostName}</span>
                                <span>•</span>
                                <span>{new Date(selectedPost.requestDate).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-xl">
                                {selectedPost.content || <em className="text-gray-500">Không có nội dung</em>}
                            </div>
                            <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                                <button
                                    onClick={() => {
                                        openRejectModal(selectedPost.blogRequestId);
                                        setSelectedPost(null);
                                    }}
                                    className="px-6 py-3 rounded-xl border border-red-600 text-red-600 hover:bg-red-50 font-medium transition"
                                >
                                    Từ chối
                                </button>
                                <button
                                    onClick={() => {
                                        openApproveConfirm(selectedPost.blogRequestId);
                                        setSelectedPost(null);
                                    }}
                                    className="px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 font-medium transition shadow-lg"
                                >
                                    Duyệt bài này
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBlogRequests;