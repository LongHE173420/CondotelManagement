import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import blogAPI from "api/blog";
import { showSuccess, showError } from "utils/modalNotification";
import ConfirmModal from "components/ConfirmModal";

interface BlogPost {
    id: number;
    thumbnailUrl?: string;
    title: string;
    author: string;
    category: string;
    createdAt: string;
    status: "Published" | "Draft"; // THÊM STATUS
    publishedAt?: string; // THÊM TRƯỜNG NÀY
}

const PageBlogList = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>(""); // THÊM FILTER STATUS
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
    const [deletingPostTitle, setDeletingPostTitle] = useState<string>("");

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // SỬA: DÙNG adminGetAllPosts THAY VÌ getPublishedPosts
                const blogPosts = await blogAPI.adminGetAllPosts();

                const convertedPosts: BlogPost[] = blogPosts.map((post: any) => {
                    // Xác định status dựa trên publishedAt
                    const status = post.publishedAt ? "Published" : "Draft";
                    const createdAt = status === "Published"
                        ? new Date(post.publishedAt).toLocaleDateString("vi-VN")
                        : new Date().toLocaleDateString("vi-VN"); // Hoặc dùng CreatedAt từ backend nếu có

                    return {
                        id: post.postId,
                        thumbnailUrl: post.featuredImageUrl,
                        title: post.title,
                        author: post.authorName,
                        category: post.categoryName,
                        createdAt: createdAt,
                        status: status,
                        publishedAt: post.publishedAt
                    };
                });
                setPosts(convertedPosts);

                const cats = await blogAPI.getCategories();
                setCategories(cats.map((cat: any) => ({ id: cat.categoryId, name: cat.name })));
            } catch (err: any) {
                setError(err.response?.data?.message || "Không thể tải danh sách bài viết");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleDelete = async (postId: number, postTitle: string) => {
        setDeletingPostId(postId);
        setDeletingPostTitle(postTitle);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingPostId) return;
        setShowConfirmModal(false);
        try {
            const success = await blogAPI.adminDeletePost(deletingPostId);
            if (success) {
                setPosts(currentPosts => currentPosts.filter(p => p.id !== deletingPostId));
                showSuccess("Xóa bài viết thành công!");
            } else {
                showError("Không tìm thấy bài viết để xóa.");
            }
        } catch (err: any) {
            showError(err.response?.data?.message || "Không thể xóa bài viết");
        } finally {
            setDeletingPostId(null);
            setDeletingPostTitle("");
        }
    };

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || post.category === selectedCategory;
        // THÊM FILTER THEO STATUS
        const matchesStatus = !selectedStatus || post.status === selectedStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Thêm hàm format date (nếu bạn muốn hiển thị ngày tháng đầy đủ hơn)
    const formatFullDate = (dateString?: string) => {
        if (!dateString) return "Chưa xuất bản";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Thống kê
    const publishedCount = posts.filter(p => p.status === "Published").length;
    const draftCount = posts.filter(p => p.status === "Draft").length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 dark:border-indigo-800"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
                </div>
                <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Quản lý Blog ({posts.length} bài viết)
                    </h2>
                    <div className="flex gap-4 mt-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                            Đã xuất bản: {publishedCount}
                        </span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                            Bản nháp: {draftCount}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/admin/blog-requests"
                        className="px-6 py-3 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Duyệt bài đăng
                    </Link>
                    <Link
                        to="/manage-blog/categories"
                        className="px-6 py-3 bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Quản lý Danh mục
                    </Link>
                    <Link
                        to="/manage-blog/add"
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Thêm bài viết mới
                    </Link>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={() => setError("")}
                            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Section */}
            <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:flex-1 md:max-w-lg px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-700 dark:text-neutral-100"
                    />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 dark:text-neutral-100 w-full md:w-auto flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Lọc theo danh mục</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                    {/* THÊM FILTER STATUS */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 dark:text-neutral-100 w-full md:w-auto flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="Published">Đã xuất bản</option>
                        <option value="Draft">Bản nháp</option>
                    </select>
                </div>
                <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                    Hiển thị {filteredPosts.length}/{posts.length} bài viết
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-indigo-200/50 dark:border-indigo-800/50">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                        <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-neutral-700 dark:to-neutral-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Ảnh bìa</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Tiêu đề</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Tác giả</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Danh mục</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Ngày tạo</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                            {filteredPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </div>
                                            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                                {posts.length === 0 ? "Chưa có bài viết nào" : "Không tìm thấy bài viết"}
                                            </p>
                                            <p className="text-neutral-600 dark:text-neutral-400">
                                                {posts.length === 0 ? "Bắt đầu bằng cách tạo bài viết mới" : "Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPosts.map((post) => (
                                    <tr key={post.id} className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-neutral-700/50 dark:hover:to-neutral-800/50 transition-all duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {post.thumbnailUrl ? (
                                                <img
                                                    src={post.thumbnailUrl}
                                                    alt={post.title}
                                                    className="w-20 h-12 object-cover rounded-lg shadow-md"
                                                />
                                            ) : (
                                                <div className="w-20 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center text-xs text-neutral-500 font-medium">
                                                    No Image
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100 max-w-xs truncate">{post.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{post.author}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300">
                                                {post.category}
                                            </span>
                                        </td>
                                        {/* THÊM CỘT TRẠNG THÁI */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${post.status === "Published"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                }`}>
                                                {post.status === "Published" ? "Đã xuất bản" : "Bản nháp"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                                            {post.status === "Published" ? formatFullDate(post.publishedAt) : post.createdAt}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <Link
                                                    to={`/manage-blog/edit/${post.id}`}
                                                    className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                                >
                                                    Sửa
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(post.id, post.title)}
                                                    className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PageBlogList;