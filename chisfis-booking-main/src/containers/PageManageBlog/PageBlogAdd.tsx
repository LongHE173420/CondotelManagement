import React, { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill";
import ImageResize from "quill-image-resize-module-react";
import "react-quill/dist/quill.snow.css";

// Đăng ký module resize với Quill
Quill.register("modules/imageResize", ImageResize);

// Component con để tạo các box ở Sidebar cho gọn
const SidebarCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-5 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold border-b border-gray-200 pb-3 mb-4">{title}</h2>
        <div className="space-y-4">{children}</div>
    </div>
);

// Component Trang Thêm Bài viết
const PageBlogAdd = () => {
    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [author, setAuthor] = useState("");
    const [featuredImage, setFeaturedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const quillRef = useRef<ReactQuill>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image upload handler - ĐÃ SỬA
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
                        // Chèn ảnh
                        editor.insertEmbed(range.index, 'image', imageUrl);

                        // QUAN TRỌNG: Di chuyển cursor xuống sau ảnh
                        setTimeout(() => {
                            editor.setSelection(range.index + 1, 0);
                        }, 100);
                    }
                };
                reader.readAsDataURL(file);
            }
        };
    }, []);

    // Video handler - ĐÃ SỬA HOÀN TOÀN
    // Video handler - THAY THẾ HOÀN TOÀN PHẦN NÀY
const videoHandler = useCallback(() => {
  const url = prompt('Nhập URL video (YouTube, Vimeo...):');
  
  if (!url) return;

  const editor = quillRef.current?.getEditor();
  const range = editor?.getSelection();
  
  if (range && editor) {
    let embedUrl = '';
    let videoTitle = 'Video nhúng';

    // Xử lý YouTube URL - SỬA LỖI Ở ĐÂY
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^#&?]{11})/)?.[1];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
        videoTitle = 'YouTube Video';
      }
    }
    // Xử lý Vimeo URL
    else if (url.includes('vimeo.com')) {
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

    // Tạo HTML cho video embed
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

    // Chèn video vào editor
    editor.clipboard.dangerouslyPasteHTML(range.index, videoHtml);
    
    // Di chuyển cursor xuống sau video
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

    // Cấu hình modules - ĐÃ SỬA
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

    const handleFeaturedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chọn file ảnh!');
                return;
            }
            const imageUrl = URL.createObjectURL(file);
            setFeaturedImage(imageUrl);
        }
    };

    const removeFeaturedImage = () => {
        if (featuredImage) {
            URL.revokeObjectURL(featuredImage);
        }
        setFeaturedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !category || !content || !author) { // <--- Thêm !author
            alert("Vui lòng nhập Tiêu đề, Tác giả, Nội dung và chọn Danh mục.");
            return;
        }
        if (!featuredImage) {
            alert("Vui lòng tải lên ảnh bìa!");
            return;
        }
        setIsLoading(true);
        console.log("Dữ liệu bài viết mới:", {
            title, summary, content, category, author, featuredImage // <--- Thêm author
        });
        setTimeout(() => {
            setIsLoading(false);
            alert("Đã thêm bài viết thành công!");
            navigate("/manage-blog");
        }, 1000);
    };

    // CSS đã sửa
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
    /* CSS CHO VIDEO RESPONSIVE */
    .ql-editor .ql-video {
      display: block;
      max-width: 100%;     /* Chiếm 100% chiều rộng */
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 9; /* Giữ tỷ lệ 16:9 */
      margin: 20px 0;
      border-radius: 8px;
    }
    /* Đảm bảo có thể gõ text sau ảnh/video */
    .ql-editor p {
      margin-bottom: 1em;
    }
    /* Style cho image resize */
    .ql-image-resize {
      cursor: move;
    }
  `;

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <style>{resizeStyles}</style>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <Link to="/manage-blog" className="text-sm text-blue-600 hover:underline">
                        &larr; Quay lại danh sách
                    </Link>
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
                                placeholder="Nhập tiêu đề tại đây..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                                Tóm tắt
                            </label>
                            <textarea
                                id="summary"
                                rows={4}
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="Nhập một đoạn tóm tắt ngắn..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-md resize-y"
                            ></textarea>
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
                                    placeholder="Viết nội dung bài viết của bạn tại đây..."
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
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
                            >
                                {isLoading ? "Đang lưu..." : "Xuất bản"}
                            </button>
                        </SidebarCard>

                        <SidebarCard title="Cài đặt">
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                Danh mục
                            </label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                                required
                            >
                                <option value="">Chọn một danh mục</option>
                                <option value="cam-nang">Cẩm nang</option>
                                <option value="khuyen-mai">Khuyến mãi</option>
                                <option value="tin-tuc">Tin tức</option>
                            </select>

                            <div>
                                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                                    Tác giả
                                </label>
                                <input
                                    type="text"
                                    id="author"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    placeholder="Nhập tên tác giả..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
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

export default PageBlogAdd;