import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import blogAPI, { HostBlogSummaryDTO } from 'api/blog';
import { toast } from 'react-toastify';
import ButtonPrimary from 'shared/Button/ButtonPrimary';
import ConfirmModal from 'components/ConfirmModal';

const HostBlogManagement = () => {
    const [blogs, setBlogs] = useState<HostBlogSummaryDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [deletingBlogId, setDeletingBlogId] = useState<number | null>(null);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const data = await blogAPI.getHostRequests();
            setBlogs(data);
        } catch (error) {
            toast.error("Không thể tải lịch sử bài viết.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleDelete = async (id: number) => {
        setDeletingBlogId(id);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingBlogId) return;
        setShowConfirmModal(false);
        try {
            await blogAPI.deleteHostRequest(deletingBlogId);
            toast.success("Đã xóa bài viết.");
            fetchBlogs(); // Reload lại danh sách
        } catch (error) {
            toast.error("Xóa thất bại.");
        } finally {
            setDeletingBlogId(null);
        }
    };

    const getStatusBadge = (status: string, reason?: string) => {
        switch (status) {
            case 'Approved':
                return <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Đã duyệt</span>;
            case 'Rejected':
                return (
                    <div className="flex flex-col items-start gap-1">
                        <span className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">Bị từ chối</span>
                        {reason && <span className="text-xs text-red-500 italic">Lý do: {reason}</span>}
                    </div>
                );
            default:
                return <span className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">Đang chờ duyệt</span>;
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Quản lý bài viết</h2>
                <Link to="/host/blog/create">
                    <ButtonPrimary>+ Viết bài mới</ButtonPrimary>
                </Link>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="text-center py-10">Đang tải dữ liệu...</div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500">Bạn chưa gửi bài viết nào.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                            <thead>
                                <tr className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Ảnh</th>
                                    <th className="px-4 py-3">Tiêu đề</th>
                                    <th className="px-4 py-3">Ngày gửi</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {blogs.map((blog) => (
                                    <tr key={blog.id}>
                                        <td className="px-4 py-4">
                                            <div className="w-16 h-12 rounded-lg overflow-hidden bg-neutral-100">
                                                {blog.thumbnail && <img src={blog.thumbnail} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-medium text-neutral-900 dark:text-neutral-100 max-w-xs truncate">
                                            {blog.title}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-neutral-500">
                                            {new Date(blog.createdDate).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-4">
                                            {getStatusBadge(blog.status, blog.rejectionReason)}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            {/* Chỉ hiện nút sửa nếu chưa duyệt hoặc bị từ chối */}
                                            {blog.status !== 'Approved' && (
                                                <div className="flex gap-3">
                                                    <Link to={`/host/blog/edit/${blog.id}`} className="text-primary-600 hover:text-primary-800 font-medium">
                                                        Sửa
                                                    </Link>
                                                    <button onClick={() => handleDelete(blog.id)} className="text-red-600 hover:text-red-800">
                                                        Xóa
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HostBlogManagement;