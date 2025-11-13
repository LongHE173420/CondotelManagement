import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill";
import ImageResize from "quill-image-resize-module-react";
import "react-quill/dist/quill.snow.css";
import blogAPI, { BlogCategoryDTO } from "api/blog";
import { uploadAPI } from "api/upload";

// Đăng ký module resize
Quill.register("modules/imageResize", ImageResize);

// Component con Sidebar
const SidebarCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-5 rounded-lg shadow-md">
    <h2 className="text-lg font-semibold border-b border-gray-200 pb-3 mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

const PageBlogEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
  const [status, setStatus] = useState<string>("Draft");
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load post data and categories
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const postId = parseInt(id);
        
        // Load post
        const post = await blogAPI.adminGetPostById(postId);
        if (post) {
          setTitle(post.title);
          setContent(post.content);
          setFeaturedImage(post.featuredImageUrl || null);
          // Note: Backend DTOs don't have status or categoryId in detail, 
          // so we'll need to get them from the post if available
        } else {
          alert("Không tìm thấy bài viết!");
          navigate("/manage-blog");
        }

        // Load categories
        const cats = await blogAPI.adminGetCategories();
        setCategories(cats);
      } catch (err: any) {
        console.error("Failed to load post:", err);
        alert(err.response?.data?.message || "Không thể tải bài viết");
        navigate("/manage-blog");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  // (Các handlers image, video, modules, formats giữ nguyên...)
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
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }, []);
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
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['link', 'image', 'video'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean'],
      ],
      handlers: { image: imageHandler, video: videoHandler }
    },
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize', 'Toolbar']
    }
  };
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video'
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      alert("Không tìm thấy ID bài viết!");
      return;
    }
    if (!title || !content) {
      alert("Vui lòng nhập Tiêu đề và Nội dung.");
      return;
    }

    setIsLoading(true);
    try {
      const postId = parseInt(id);
      let featuredImageUrl: string | undefined = undefined;
      
      // Upload featured image if changed
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
      } else if (featuredImage) {
        // Keep existing image URL
        featuredImageUrl = featuredImage;
      }

      // Update post
      await blogAPI.adminUpdatePost(postId, {
        title,
        content,
        featuredImageUrl,
        status,
        categoryId,
      });

      alert("Đã cập nhật bài viết thành công!");
      navigate("/manage-blog");
    } catch (err: any) {
      console.error("Failed to update post:", err);
      alert(err.response?.data?.message || "Không thể cập nhật bài viết. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.")) {
      try {
        setIsLoading(true);
        const postId = parseInt(id);
        const success = await blogAPI.adminDeletePost(postId);
        if (success) {
          alert("Đã xóa bài viết.");
          navigate("/manage-blog");
        } else {
          alert("Không tìm thấy bài viết để xóa.");
        }
      } catch (err: any) {
        console.error("Failed to delete post:", err);
        alert(err.response?.data?.message || "Không thể xóa bài viết.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // CSS cho editor (giữ nguyên như file Add)
  const editorStyles = `
    .ql-toolbar.ql-snow {
      position: sticky; top: 0; z-index: 10; background: white;
      border-top: none !important; border-left: none !important; border-right: none !important;
      border-bottom: 1px solid #ccc !important;
    }
    .ql-container.ql-snow { border: none !important; }
    .ql-editor {
      min-height: 400px; font-size: 16px; line-height: 1.6;
      padding: 1.5rem !important;
    }
    .ql-editor img, .ql-editor .ql-video {
      max-width: 100%; height: auto; display: block;
      margin: 10px 0; aspect-ratio: 16 / 9;
    }
      .ql-editor .video-embed-wrapper {
  margin: 20px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 600px; /* THAY ĐỔI SỐ NÀY để điều chỉnh kích thước */
  margin-left: auto;
  margin-right: auto;
}
.ql-editor iframe {
  border-radius: 8px;
}
  `;

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
      <style>{editorStyles}</style>

      <form onSubmit={handleUpdate}>
        {/* --- Link quay lại --- */}
        <div className="mb-4">
          <Link to="/manage-blog" className="text-sm text-blue-600 hover:underline">
            &larr; Quay lại danh sách
          </Link>
        </div>

        {/* --- Bố cục 2 cột --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* --- CỘT TRÁI (NỘI DUNG CHÍNH) --- */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">

            {/* Tiêu đề */}
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

            {/* Nội dung với ReactQuill */}
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
            </div>
          </div>

          {/* --- CỘT PHẢI (SIDEBAR) --- */}
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
                  disabled={isLoading || loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? "Đang cập nhật..." : "Cập nhật bài viết"}
                </button>
                <button
                  type="button"
                  disabled={isLoading || loading}
                  onClick={handleDelete}
                  className="w-full px-4 py-2 bg-white text-red-600 border border-red-500 rounded-md hover:bg-red-50 disabled:bg-gray-100"
                >
                  Xóa bài viết
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

            {/* Box Ảnh bìa (Giữ nguyên) */}
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

export default PageBlogEdit; // <-- 2. ĐỔI TÊN EXPORT tui