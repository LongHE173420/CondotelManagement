import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import blogAPI from "api/blog";

interface BlogPost {
    id: number;
    thumbnailUrl?: string;
    title: string;
    author: string;
    category: string;
    createdAt: string;
    status?: string;
}

// --- Component Trang Danh sách Bài viết ---
const PageBlogList = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Load posts
                const blogPosts = await blogAPI.adminGetAllPosts();
                const convertedPosts: BlogPost[] = blogPosts.map((post) => ({
                    id: post.postId,
                    thumbnailUrl: post.featuredImageUrl,
                    title: post.title,
                    author: post.authorName,
                    category: post.categoryName,
                    createdAt: post.publishedAt 
                        ? new Date(post.publishedAt).toLocaleDateString("vi-VN")
                        : "Chưa xuất bản",
                }));
                setPosts(convertedPosts);

                // Load categories
                const cats = await blogAPI.adminGetCategories();
                setCategories(cats.map(cat => ({ id: cat.categoryId, name: cat.name })));
            } catch (err: any) {
                console.error("Failed to load blog posts:", err);
                setError(err.response?.data?.message || "Không thể tải danh sách bài viết");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Hàm xử lý Xóa
    const handleDelete = async (postId: number, postTitle: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa bài viết "${postTitle}" không?`)) {
            try {
                const success = await blogAPI.adminDeletePost(postId);
                if (success) {
                    setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
                    alert("Xóa bài viết thành công!");
                } else {
                    alert("Không tìm thấy bài viết để xóa.");
                }
            } catch (err: any) {
                console.error("Failed to delete post:", err);
                alert(err.response?.data?.message || "Không thể xóa bài viết");
            }
        }
    };

    // Filter posts
    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             post.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || post.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">

                {/* --- Header: Tiêu đề và Nút Thêm --- */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Danh sách bài viết
                    </h1>
                    <div className="flex gap-3">
                        <Link
                            to="/manage-blog/categories"
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                            Quản lý Danh mục
                        </Link>
                        <Link
                            to="/manage-blog/add"
                            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                        >
                            Thêm bài viết mới
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-md">
                        {error}
                    </div>
                )}

                {/* --- Thanh Filter và Tìm kiếm --- */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:flex-1 md:max-w-lg px-4 py-2 border border-gray-300 rounded-md"
                    />

                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="pl-4 pr-10 py-2 border border-gray-300 rounded-md bg-white w-full md:w-auto flex-shrink-0"
                    >
                        <option value="">Lọc theo danh mục</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* --- Bảng Dữ liệu --- */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ảnh bìa</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tác giả</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        {posts.length === 0 ? "Chưa có bài viết nào" : "Không tìm thấy bài viết"}
                                    </td>
                                </tr>
                            ) : (
                                filteredPosts.map((post) => (
                                    <tr key={post.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {post.thumbnailUrl ? (
                                                <img 
                                                    src={post.thumbnailUrl} 
                                                    alt={post.title}
                                                    className="w-16 h-10 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-16 h-10 bg-gray-200 rounded text-xs flex items-center justify-center text-gray-500">
                                                    No Image
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">{post.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{post.author}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{post.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{post.createdAt}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link
                                                to={`/manage-blog/edit/${post.id}`}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                Sửa
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(post.id, post.title)}
                                                className="text-red-600 hover:text-red-800 ml-4"
                                            >
                                                Xóa
                                            </button>
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
