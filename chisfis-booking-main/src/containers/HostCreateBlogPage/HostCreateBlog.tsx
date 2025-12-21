import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import blogAPI, { BlogCategoryDTO } from 'api/blog';
import uploadAPI from 'api/upload';
import { toast } from 'react-toastify';
import ReactQuill, { Quill } from "react-quill";
import ImageResize from "quill-image-resize-module-react";
import "react-quill/dist/quill.snow.css";
import ButtonPrimary from "shared/Button/ButtonPrimary";

// Register resize module
Quill.register("modules/imageResize", ImageResize);

// CSS styles
const styles = `
    .host-blog-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    
    /* Tùy chỉnh scrollbar */
    .host-blog-scrollbar::-webkit-scrollbar {
        width: 8px;
    }
    
    .host-blog-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }
    
    .host-blog-scrollbar::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }
    
    .host-blog-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
    }
    
    /* Tùy chỉnh React Quill */
    .host-blog-quill .ql-toolbar {
        border-top-left-radius: 0.75rem;
        border-top-right-radius: 0.75rem;
        background: #f9fafb;
        border-color: #e5e7eb;
        font-family: 'Inter', sans-serif;
    }
    
    .host-blog-quill .ql-container {
        border-bottom-left-radius: 0.75rem;
        border-bottom-right-radius: 0.75rem;
        border-color: #e5e7eb;
        font-family: 'Inter', sans-serif;
        font-size: 16px;
        min-height: 300px;
    }
    
    .host-blog-quill .ql-editor {
        min-height: 350px;
        font-family: 'Inter', sans-serif;
        line-height: 1.6;
    }
    
    .host-blog-quill .ql-editor.ql-blank::before {
        font-style: normal;
        color: #9ca3af;
        font-family: 'Inter', sans-serif;
    }
    
    /* Tùy chỉnh select */
    .host-blog-select {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
    }
    
    /* Tùy chỉnh focus state */
    .host-blog-input:focus, .host-blog-textarea:focus, .host-blog-select:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    
    /* Animation cho các phần tử */
    .host-blog-transition {
        transition: all 0.2s ease-in-out;
    }
    
    .host-blog-hover-scale:hover {
        transform: scale(1.02);
    }
`;

const HostCreateBlog = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [categoryId, setCategoryId] = useState<number | string>("");
    const [featuredImageUrl, setFeaturedImageUrl] = useState("");
    const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const quillRef = useRef<ReactQuill>(null);

    // Tải font chữ Inter (Google Fonts) và CSS
    useEffect(() => {
        // Thêm font Inter
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        // Thêm style tag
        const styleTag = document.createElement('style');
        styleTag.innerHTML = styles;
        document.head.appendChild(styleTag);

        // Áp dụng font chữ mặc định
        document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";

        return () => {
            document.body.style.fontFamily = '';
            styleTag.remove();
            fontLink.remove();
        };
    }, []);

    // Load categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await blogAPI.getCategories();
                setCategories(data);
                if (!isEditMode && data.length > 0) {
                    setCategoryId(data[0].categoryId);
                }
            } catch {
                toast.error("Không thể tải danh mục.");
            }
        };
        loadCategories();
    }, [isEditMode]);

    // Load post khi edit
    useEffect(() => {
        if (!isEditMode || !id) return;

        const loadPost = async () => {
            setFetching(true);
            try {
                const post = await blogAPI.getHostRequestDetail(Number(id));
                if (!post) {
                    toast.error("Không tìm thấy bài viết.");
                    return navigate("/host-dashboard?tab=blogs");
                }
                if (post.status === "Approved") {
                    toast.error("Bài viết đã duyệt không thể chỉnh sửa.");
                    return navigate("/host-dashboard?tab=blogs");
                }

                setTitle(post.title || "");
                setContent(post.content || "");
                setFeaturedImageUrl(post.thumbnail || "");
                setCategoryId(post.categoryId ?? "");
            } catch {
                toast.error("Lỗi tải bài viết.");
                navigate("/host-dashboard?tab=blogs");
            } finally {
                setFetching(false);
            }
        };
        loadPost();
    }, [isEditMode, id, navigate]);

    // Chèn ảnh vào nội dung
    const imageHandler = useCallback(() => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            try {
                const res = await uploadAPI.uploadImage(file);
                const editor = quillRef.current?.getEditor();
                const range = editor?.getSelection(true);
                if (range && editor) {
                    editor.insertEmbed(range.index, "image", res.imageUrl);
                    editor.setSelection(range.index + 1, 0);
                }
            } catch {
                toast.error("Tải ảnh thất bại.");
            }
        };
    }, []);

    // Nhúng video
    const videoHandler = useCallback(() => {
        const url = prompt("Nhập URL YouTube hoặc Vimeo:");
        if (!url) return;

        let embedUrl = "";
        if (url.includes("youtube") || url.includes("youtu.be")) {
            const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            embedUrl = match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : "";
        } else if (url.includes("vimeo.com")) {
            const match = url.match(/vimeo\.com\/(\d+)/);
            embedUrl = match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : "";
        }

        if (!embedUrl) return toast.warning("URL video không hợp lệ.");

        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection(true);
        if (range && editor) {
            const html = `
                <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:24px 0;">
                    <iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
                </div>
            `;
            editor.clipboard.dangerouslyPasteHTML(range.index, html);
            editor.setSelection(range.index + 1, 0);
        }
    }, []);

    const modules = {
        toolbar: {
            container: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image", "video"],
                ["blockquote", "code-block"],
                ["clean"]
            ],
            handlers: { image: imageHandler, video: videoHandler }
        },
        imageResize: { parchment: Quill.import("parchment"), modules: ["Resize", "DisplaySize"] }
    };

    const formats = ["header", "bold", "italic", "underline", "strike", "list", "bullet", "link", "image", "video", "blockquote", "code-block"];

    // Upload ảnh bìa
    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return toast.error("Chỉ chấp nhận ảnh.");
        if (file.size > 5 * 1024 * 1024) return toast.error("Ảnh tối đa 5MB.");

        setUploadingCover(true);
        try {
            const res = await uploadAPI.uploadImage(file);
            setFeaturedImageUrl(res.imageUrl);
            toast.success("Ảnh bìa đã được tải lên!");
        } catch {
            toast.error("Tải ảnh bìa thất bại.");
        } finally {
            setUploadingCover(false);
        }
    };

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !categoryId) {
            return toast.warning("Vui lòng điền đầy đủ tiêu đề, nội dung và danh mục.");
        }

        setLoading(true);
        try {
            const payload = {
                title,
                content,
                featuredImageUrl: featuredImageUrl || undefined,
                categoryId: Number(categoryId)
            };

            if (isEditMode) {
                await blogAPI.updateHostRequest(Number(id), payload);
                toast.success("Cập nhật thành công! Bài viết đã được gửi lại chờ duyệt.");
            } else {
                const res = await blogAPI.hostCreateRequest(payload);
                toast.success(res.message || "Gửi yêu cầu thành công!");
            }
            navigate("/host-dashboard?tab=blogs");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Có lỗi xảy ra.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Đang tải bài viết...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="host-blog-container bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 host-blog-scrollbar">
                {/* Back button */}
                <button
                    onClick={() => navigate("/host-dashboard?tab=blogs")}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium mb-8 transition-all duration-200 group"
                >
                    <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại danh sách bài viết
                </button>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Editor */}
                    <div className="lg:col-span-9 space-y-8">
                        {/* Title */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl border border-gray-100">
                            <label className="block text-xl font-semibold text-gray-900 mb-4">
                                Tiêu đề bài viết
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nhập tiêu đề hấp dẫn, thu hút người đọc..."
                                className="host-blog-input w-full text-3xl font-bold px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 focus:bg-white"
                                required
                            />
                        </div>

                        {/* Rich Editor */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                <label className="text-xl font-semibold text-gray-900">Nội dung bài viết</label>
                                <p className="text-sm text-gray-500 mt-2 font-normal">Sử dụng công cụ để định dạng, chèn ảnh, video...</p>
                            </div>
                            <div className="host-blog-quill">
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    modules={modules}
                                    formats={formats}
                                    className="bg-white min-h-[400px]"
                                    placeholder="Bắt đầu viết câu chuyện du lịch của bạn..."
                                />
                            </div>
                            <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-t border-gray-100">
                                <p className="text-sm text-gray-700 font-medium">
                                    💡 <strong className="font-semibold">Mẹo:</strong> Chèn ảnh/video bằng nút trong thanh công cụ • Kéo góc ảnh để resize • Hỗ trợ YouTube & Vimeo
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Category */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">Danh mục</h3>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                                className="host-blog-select w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium cursor-pointer"
                                required
                            >
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map((cat) => (
                                    <option key={cat.categoryId} value={cat.categoryId} className="py-2">{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Cover Image */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">Ảnh bìa</h3>
                            {uploadingCover ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mb-4"></div>
                                    <p className="text-gray-600 font-medium">Đang tải ảnh...</p>
                                </div>
                            ) : featuredImageUrl ? (
                                <div className="relative group">
                                    <img
                                        src={featuredImageUrl}
                                        alt="Ảnh bìa"
                                        className="w-full rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-[1.02]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFeaturedImageUrl("")}
                                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-9 h-9 opacity-90 hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-lg transform hover:scale-110"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <label className="block cursor-pointer group">
                                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-all duration-200">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-blue-200 transition-all duration-200">
                                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <p className="font-semibold text-gray-800">Tải lên ảnh bìa</p>
                                        <p className="text-sm text-gray-500 mt-1 font-normal">JPG, PNG • Tối đa 5MB</p>
                                    </div>
                                </label>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            <div className="flex flex-col gap-4">
                                <button
                                    type="button"
                                    onClick={() => navigate("/host-dashboard?tab=blogs")}
                                    className="w-full px-6 py-3.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 transition-all duration-200 hover:border-gray-300"
                                >
                                    Hủy bỏ
                                </button>
                                <ButtonPrimary
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transform hover:-translate-y-0.5"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </span>
                                    ) : isEditMode ? "Lưu thay đổi" : "Gửi yêu cầu duyệt"}
                                </ButtonPrimary>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HostCreateBlog;