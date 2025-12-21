import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import blogAPI, { HostBlogSummaryDTO } from "api/blog";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import { toast } from "react-toastify";

const HostBlogContent = () => {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState<HostBlogSummaryDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null); // ID bài đang xác nhận xóa

    // 1. Fetch danh sách blog
    const fetchBlogs = async () => {
        try {
            const data = await blogAPI.getHostRequests();
            setBlogs(data);
        } catch (error) {
            toast.error("Không thể tải danh sách bài viết.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    // 2. Xử lý xóa - chỉ mở modal confirm
    const openDeleteConfirm = (id: number) => {
        setDeleteConfirm(id);
    };

    // 3. Hàm thực hiện xóa khi user bấm "Xóa bài viết" trong modal
    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const result = await blogAPI.deleteHostRequest(deleteConfirm);
            toast.success(result?.message || "Đã xóa bài viết thành công!");
            await fetchBlogs(); // Refresh lại danh sách
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa bài viết.");
        } finally {
            setDeleteConfirm(null); // Đóng modal dù thành công hay thất bại
        }
    };

    // Helper render trạng thái
    const renderStatus = (status: string, reason?: string) => {
        switch (status) {
            case "Approved":
                return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đã duyệt</span>;
            case "Rejected":
                return (
                    <div className="flex flex-col">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 w-fit">Từ chối</span>
                        {reason && <span className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={reason}>Lý do: {reason}</span>}
                    </div>
                );
            default:
                return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Quản lý bài viết</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Xem trạng thái và quản lý các bài blog du lịch của bạn
                    </p>
                </div>

                <Link to="/host-dashboard/create-blog?tab=blogs">
                    <ButtonPrimary>
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Viết bài mới
                        </span>
                    </ButtonPrimary>
                </Link>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-neutral-500">Đang tải dữ liệu...</div>
                ) : blogs.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Chưa có bài viết nào</h3>
                        <p className="text-neutral-500 mt-1 mb-4">Hãy chia sẻ những trải nghiệm thú vị của bạn ngay.</p>
                        <Link to="/host-dashboard/create-blog?tab=blogs" className="text-primary-600 hover:underline">
                            Tạo bài viết đầu tiên
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                            <thead className="bg-neutral-50 dark:bg-neutral-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Bài viết</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Ngày gửi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
                                {blogs.map((item) => (
                                    <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-200">
                                                    {item.thumbnail ? (
                                                        <img className="h-10 w-10 object-cover" src={item.thumbnail} alt={item.title} />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-neutral-200 text-neutral-500 text-xs">No Img</div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-neutral-900 dark:text-white max-w-[200px] truncate" title={item.title}>
                                                        {item.title}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                            {new Date(item.createdDate).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStatus(item.status, item.rejectionReason)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {item.status !== "Approved" ? (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/host-dashboard/blog/edit/${item.id}?tab=blogs`)}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                                                    >
                                                        Sửa
                                                    </button>

                                                    <button
                                                        onClick={() => openDeleteConfirm(item.id)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Xóa
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-neutral-400 italic text-xs cursor-not-allowed">
                                                    Đã khóa
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ===== MODAL CONFIRM XÓA - ĐẸP, HIỆN ĐẠI ===== */}
            {deleteConfirm !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">
                            Xác nhận xóa bài viết
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                            Bạn có chắc chắn muốn xóa bài viết này? Hành động này <strong>không thể hoàn tác</strong>.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-5 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 font-medium transition"
                            >
                                Hủy
                            </button>
                            <ButtonPrimary
                                onClick={confirmDelete}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Xóa bài viết
                            </ButtonPrimary>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostBlogContent;