import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill";
import ImageResize from "quill-image-resize-module-react";
import "react-quill/dist/quill.snow.css";
import blogAPI, { BlogCategoryDTO } from "api/blog";
import { uploadAPI } from "api/upload";
import { useAuth } from "contexts/AuthContext";

// Đăng ký module resize với Quill
Quill.register("modules/imageResize", ImageResize);

// Component con để tạo các box ở Sidebar cho gọn
const SidebarCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-5 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold border-b border-gray-200 pb-3 mb-4">{title}</h2>
        <div className="space-y-4">{children}</div>
    </div>
);

// Component Trang Tạo Blog Trải nghiệm cho User
const PageCreateBlogExperience = () => {
    const { isAuthenticated } = useAuth();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
    const [featuredImage, setFeaturedImage] = useState<string | null>(null);
    const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
    const [status, setStatus] = useState<string>("Draft");
    const navigate = useNavigate();
    const quillRef = useRef<ReactQuill>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await blogAPI.getCategories();
                setCategories(cats);
            } catch (err) {
                console.error("Failed to load categories:", err);
            }
        };
        loadCategories();
    }, []);

    // Image upload handler
    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const reader = new FileReader();

                reader.onload = () => {
                    const imageUrl = reader.result as string;
                    const editor = quillRef.current?.getEditor();
                    const range = editor?.getSelection();

                    if (range && editor) {
                        editor.insertEmbed(range.index, 'image', imageUrl);
                        setTimeout(() => {
                            editor.setSelection(range.index + 1, 0);
                        }, 100);
                    }
                };
                reader.readAsDataURL(file);
            }
        };
    }, []);

    // Video handler
    const videoHandler = useCallback(() => {
        const url = prompt('Nhập URL video (YouTube, Vimeo...):');
        
        if (!url) return;

        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection();
        
        if (range && editor) {
            let embedUrl = '';
            let videoTitle = 'Video nhúng';

            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^#&?]{11})/)?.[1];
                if (videoId) {
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                    videoTitle = 'YouTube Video';
                }
            } else if (url.includes('vimeo.com')) {
                const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
                if (videoId) {
                    embedUrl = `https://player.vimeo.com/video/${videoId}`;
                    videoTitle = 'Vimeo Video';
                }
            }

            if (!embedUrl) {
                alert('Không thể xử lý URL video này. Vui lòng kiểm tra lại.');
                return;
            }

            const videoHtml = `
                <div class="video-embed-wrapper">
                    <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 8px; background: #000;">
                        <iframe 
                            src="${embedUrl}"
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
                            allowfullscreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title="${videoTitle}"
                        ></iframe>
                    </div>
                    <div style="text-align: center; margin-top: 8px; font-size: 14px; color: #666;">
                        📺 ${videoTitle}
                    </div>
                </div>
                <p><br></p>
            `;

            editor.clipboard.dangerouslyPasteHTML(range.index, videoHtml);
            
            setTimeout(() => {
                editor.setSelection(range.index + 2, 0);
            }, 100);
        }
    }, []);

    // Link handler
    const linkHandler = useCallback(() => {
        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection();

        if (range && editor) {
            if (range.length > 0) {
                const url = prompt('Nhập URL:');
                if (url) {
                    editor.formatText(range.index, range.length, 'link', url);
                }
            } else {
                const url = prompt('Nhập URL:');
                const text = prompt('Nhập text hiển thị:') || url || 'Liên kết';
                if (url) {
                    editor.insertText(range.index, text);
                    editor.formatText(range.index, text.length, 'link', url);
                    editor.setSelection(range.index + text.length, 0);
                }
            }
        }
    }, []);

    // Cấu hình modules
    const modules = {
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['link', 'image', 'video'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['blockquote'],
                ['clean'],
            ],
            handlers: {
                image: imageHandler,
                video: videoHandler,
                link: linkHandler
            }
        },
        imageResize: {
            parchment: Quill.import('parchment'),
            modules: ['Resize', 'DisplaySize', 'Toolbar']
        },
        clipboard: {
            matchVisual: false,
        }
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'link', 'image', 'video',
        'list', 'bullet',
        'blockquote'
    ];

    const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chọn file ảnh!');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Kích thước file không được vượt quá 5MB!');
                return;
            }
            setFeaturedImageFile(file);
            const imageUrl = URL.createObjectURL(file);
            setFeaturedImage(imageUrl);
        }
    };

    const removeFeaturedImage = () => {
        if (featuredImage) {
            URL.revokeObjectURL(featuredImage);
        }
        setFeaturedImage(null);
        setFeaturedImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            alert("Vui lòng nhập Tiêu đề và Nội dung.");
            return;
        }
        
        setIsLoading(true);
        try {
            let featuredImageUrl: string | undefined = undefined;
            
            // Upload featured image if exists
            if (featuredImageFile) {
                try {
                    const uploadResult = await uploadAPI.uploadImage(featuredImageFile);
                    featuredImageUrl = uploadResult.imageUrl;
                } catch (uploadErr) {
                    console.error("Failed to upload image:", uploadErr);
                    alert("Không thể tải ảnh lên. Vui lòng thử lại.");
                    setIsLoading(false);
                    return;
                }
            }

            // Create post using user endpoint
            await blogAPI.createPost({
                title,
                content,
                featuredImageUrl,
                status,
                categoryId,
            });

            alert("Đã tạo bài viết thành công!");
            navigate("/blog");
        } catch (err: any) {
            console.error("Failed to create post:", err);
            alert(err.response?.data?.message || "Không thể tạo bài viết. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    // CSS styles
    const resizeStyles = `
    .ql-toolbar.ql-snow {
      position: sticky;
      top: 0;
      z-index: 10;
      background: white;
      border: 1px solid #ccc;
      border-top: none;
      border-left: none;
      border-right: none;
    }
    .ql-container.ql-snow {
      border: 1px solid #ccc;
      border-top: none;
      border-left: none;
      border-right: none;
      border-bottom: none;
    }
    .ql-editor {
      min-height: 400px;
      font-size: 16px;
      line-height: 1.6;
      padding: 1.5rem;
    }
    .ql-editor img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 20px 0;
      border-radius: 8px;
      cursor: pointer;
    }
    .ql-editor .ql-video {
      display: block;
      max-width: 100%;
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 9;
      margin: 20px 0;
      border-radius: 8px;
    }
    .ql-editor p {
      margin-bottom: 1em;
    }
    .ql-image-resize {
      cursor: move;
    }
  `;

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <style>{resizeStyles}</style>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <Link to="/blog" className="text-sm text-blue-600 hover:underline">
                        &larr; Quay lại blog
                    </Link>
                </div>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Chia sẻ trải nghiệm của bạn</h1>
                    <p className="text-gray-600 mt-2">Viết về những trải nghiệm du lịch, nghỉ dưỡng tuyệt vời của bạn</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8 lg:col-span-9 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                Tiêu đề bài viết
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ví dụ: Trải nghiệm tuyệt vời tại Đà Lạt..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>

                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <label className="block text-sm font-medium text-gray-700 mb-2 px-6 pt-6">
                                Nội dung
                            </label>
                            <div className="ql-container-custom">
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    modules={modules}
                                    formats={formats}
                                    placeholder="Chia sẻ trải nghiệm của bạn tại đây..."
                                />
                            </div>
                            <div className="px-6 pb-4 text-sm text-gray-500">
                                <p>💡 <strong>Mẹo sử dụng:</strong></p>
                                <p>• Ảnh và video sau khi chèn sẽ tự động di chuyển cursor xuống dưới</p>
                                <p>• Kéo góc ảnh để thay đổi kích thước</p>
                                <p>• Hỗ trợ YouTube, Vimeo links</p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-4 lg:col-span-3 space-y-6">
                        <SidebarCard title="Xuất bản">
                            <div className="space-y-3">
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                    Trạng thái
                                </label>
                                <select
                                    id="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                                >
                                    <option value="Draft">Bản nháp</option>
                                    <option value="Published">Xuất bản</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                                >
                                    {isLoading ? "Đang lưu..." : status === "Published" ? "Xuất bản" : "Lưu bản nháp"}
                                </button>
                            </div>
                        </SidebarCard>

                        <SidebarCard title="Cài đặt">
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                Danh mục
                            </label>
                            <select
                                id="category"
                                value={categoryId || ""}
                                onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                            >
                                <option value="">Chọn một danh mục (tùy chọn)</option>
                                {categories.map(cat => (
                                    <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                                ))}
                            </select>
                        </SidebarCard>

                        <SidebarCard title="Ảnh bìa">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFeaturedImageUpload}
                                accept="image/*"
                                className="hidden"
                            />

                            {featuredImage ? (
                                <div className="relative">
                                    <img
                                        src={featuredImage}
                                        alt="Ảnh bìa"
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeFeaturedImage}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50"
                                >
                                    <div className="text-center">
                                        <span className="text-sm text-gray-600 block">Nhấn để tải ảnh lên</span>
                                        <span className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (Max 5MB)</span>
                                    </div>
                                </div>
                            )}

                            {featuredImage && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full mt-2 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Thay đổi ảnh
                                </button>
                            )}
                        </SidebarCard>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PageCreateBlogExperience;

