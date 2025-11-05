import React, { useState, useRef, useCallback, useEffect } from "react"; // <-- 1. THÊM useEffect
import { Link, useNavigate, useParams } from "react-router-dom"; // <-- 1. THÊM useParams
import ReactQuill, { Quill } from "react-quill";
import ImageResize from "quill-image-resize-module-react";
import "react-quill/dist/quill.snow.css";

// Đăng ký module resize
Quill.register("modules/imageResize", ImageResize);

// Component con Sidebar
const SidebarCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-5 rounded-lg shadow-md">
    <h2 className="text-lg font-semibold border-b border-gray-200 pb-3 mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

// 2. ĐỔI TÊN COMPONENT
const PageBlogEdit = () => {
  const { id } = useParams(); // <-- 3. LẤY ID TỪ URL
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState(""); // <-- THÊM DÒNG NÀY
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. THÊM useEffect ĐỂ TẢI DỮ LIỆU CŨ
  useEffect(() => {
    // TODO: Dùng `id` này để gọi API và lấy dữ liệu bài viết thật
    console.log("Đang tải dữ liệu cho bài viết ID:", id);

    // Giả lập dữ liệu đã fetch
    setTitle("Trải nghiệm kỳ nghỉ 5 sao tại Condotel Vũng Tàu");
    setSummary("Đây là tóm tắt của bài viết đã có...");
    setContent("<p>Đây là <strong>nội dung</strong> bài viết đã được tải từ database...</p>");
    setCategory("cam-nang");
    setAuthor("Nguyễn Văn An"); // <-- THÊM DÒNG NÀY
    setFeaturedImage("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"); // Ảnh mẫu
  }, [id]); // Chạy lại khi id thay đổi

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

  // 5. SỬA LẠI HÀM SUBMIT THÀNH HÀM UPDATE
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !content) {
      alert("Vui lòng nhập Tiêu đề, Nội dung và chọn Danh mục.");
      return;
    }
    if (!featuredImage) {
      alert("Vui lòng tải lên ảnh bìa!");
      return;
    }

    setIsLoading(true);
    console.log("Cập nhật bài viết với ID:", id, {
      title, summary, content, category, featuredImage
    });

    setTimeout(() => {
      setIsLoading(false);
      alert("Đã cập nhật bài viết thành công!");
      navigate("/manage-blog"); // Quay lại trang danh sách
    }, 1000);
  };

  // 4. THÊM HÀM XỬ LÝ XÓA
  const handleDelete = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.")) {
      setIsLoading(true);
      // TODO: Gọi API xóa bài viết với 'id'
      console.log("Xóa bài viết với ID:", id);
      setTimeout(() => {
        setIsLoading(false);
        alert("Đã xóa bài viết.");
        navigate("/manage-blog");
      }, 1000);
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

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <style>{editorStyles}</style>

      {/* 5. SỬA onSUBMIT */}
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

            {/* Tóm tắt */}
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

            {/* 4. SỬA LẠI BOX HÀNH ĐỘNG */}
            <SidebarCard title="Hành động">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? "Đang cập nhật..." : "Cập nhật bài viết"}
              </button>
              <button
                type="button" // Quan trọng: type="button" để không submit form
                disabled={isLoading}
                onClick={handleDelete}
                className="w-full px-4 py-2 bg-white text-red-600 border border-red-500 rounded-md hover:bg-red-50 disabled:bg-gray-100"
              >
                Xóa bài viết
              </button>
            </SidebarCard>

            {/* Box Cài đặt (Giữ nguyên) */}
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