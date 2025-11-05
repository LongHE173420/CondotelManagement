import React, { useState } from "react"; // <-- DÒNG NÀY RẤT QUAN TRỌNG
import { Link } from "react-router-dom";

// --- Định nghĩa kiểu dữ liệu cho bài viết ---
type PostStatus = "Đã xuất bản" | "Bản nháp";

interface BlogPost {
    id: string;
    thumbnailUrl: string;
    title: string;
    author: string;
    category: string;
    createdAt: string;
}

// --- Dữ liệu mẫu (Mock Data) dựa trên ảnh của bạn ---
const mockPostData: BlogPost[] = [
    {
        id: "1",
        thumbnailUrl: "",
        title: "Trải nghiệm kỳ nghỉ 5 sao tại Condotel Vũng Tàu",
        author: "Nguyễn Văn An",
        category: "Cẩm nang",
        createdAt: "20/10/2025",
    },
    {
        id: "2",
        thumbnailUrl: "",
        title: "Khuyến mãi hè rực rỡ: Giảm 30% khi đặt phòng",
        author: "Trần Thị Bình",
        category: "Khuyến mãi",
        createdAt: "15/10/2025",
    },
    {
        id: "3",
        thumbnailUrl: "",
        title: "5 địa điểm ăn uống không thể bỏ lỡ gần đây",
        author: "Nguyễn Văn An",
        category: "Cẩm nang",
        createdAt: "12/10/2025",
    },
    {
        id: "4",
        thumbnailUrl: "",
        title: "Condotel Royal khai trương tiện ích hồ bơi vô cực",
        author: "Lê Văn Cường",
        category: "Tin tức",
        createdAt: "10/10/2025",
    },
];

// --- Component Trang Danh sách Bài viết ---
const PageBlogList = () => {
    const [posts, setPosts] = useState<BlogPost[]>(mockPostData);
    const [currentPage, setCurrentPage] = useState(1);

    // Hàm xử lý Xóa (sau này sẽ gọi API)
    const handleDelete = (postId: string, postTitle: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa bài viết "${postTitle}" không?`)) {
            // TODO: Gọi API xóa
            console.log("Xóa bài viết:", postId);
            setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
        }
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">

                {/* --- Header: Tiêu đề và Nút Thêm --- */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Danh sách bài viết
                    </h1>
                    {/* Nút này đã link đến trang /manage-blog/add (bạn sẽ tạo sau) */}
                    <Link
                        to="/manage-blog/add"
                        className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                    >
                        Thêm bài viết mới
                    </Link>
                </div>

                {/* --- Thanh Filter và Tìm kiếm --- */}
                {/* --- Thanh Filter và Tìm kiếm --- */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Tìm kiếm "
                        className="w-full md:flex-1 md:max-w-lg px-4 py-2 border border-gray-300 rounded-md"
                    />

                    <select className="pl-4 pr-10 py-2 border border-gray-300 rounded-md bg-white w-full md:w-auto flex-shrink-0">
                        <option value="">Lọc theo danh mục</option>
                        <option value="cam-nang">Cẩm nang</option>
                        <option value="khuyen-mai">Khuyến mãi</option>
                        <option value="tin-tuc">Tin tức</option>
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
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="w-16 h-10 bg-gray-200 rounded text-xs flex items-center justify-center text-gray-500">
                                            Thumbnail
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{post.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{post.author}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{post.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{post.createdAt}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {/* Link đến trang /manage-blog/edit/:id (bạn sẽ tạo sau) */}
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
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- Phân trang (Pagination) --- */}
                <div className="flex justify-center items-center mt-6">
                    <nav className="flex items-center space-x-2">
                        <button className="px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100">
                            Trang đầu
                        </button>
                        <button className="px-4 py-2 text-sm text-white bg-gray-600 rounded-md">
                            1
                        </button>
                        <button className="px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100">
                            2
                        </button>
                        <button className="px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100">
                            3
                        </button>
                        <button className="px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100">
                            Trang cuối
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default PageBlogList; // <-- DÒNG NÀY CŨNG RẤT QUAN TRỌNG