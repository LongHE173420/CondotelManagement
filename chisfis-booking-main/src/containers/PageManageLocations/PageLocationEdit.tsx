import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

// Component con Sidebar
const SidebarCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-5 rounded-lg shadow-md">
    <h2 className="text-lg font-semibold border-b border-gray-200 pb-3 mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

const PageLocationEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Tải dữ liệu giả lập
  useEffect(() => {
    // TODO: Gọi API lấy chi tiết location với `id`
    // Dữ liệu giả lập
    setName("Vũng Tàu");
    setDescription("Một thành phố biển nổi tiếng gần TP.HCM.");
  }, [id]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("❌ Vui lòng nhập Tên địa điểm.");
      return;
    }
    setIsLoading(true);
    // TODO: Gọi API cập nhật
    setTimeout(() => {
      setIsLoading(false);
      toast.success("✅ Cập nhật địa điểm thành công!");
      navigate("/manage-locations");
    }, 1000);
  };
  
  const handleDelete = () => {
    toast.info(`Xóa địa điểm "${name}"?`, {
      position: "bottom-center",
      autoClose: false,
      closeButton: true,
    });

    setIsLoading(true);
    // TODO: Gọi API xóa
    setTimeout(() => {
      setIsLoading(false);
      toast.success("✅ Đã xóa địa điểm.");
      navigate("/manage-locations");
    }, 1000);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <form onSubmit={handleUpdate}>
        <div className="mb-4">
          <Link to="/manage-locations" className="text-sm text-blue-600 hover:underline">
            &larr; Quay lại danh sách
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* --- CỘT TRÁI (NỘI DUNG CHÍNH) --- */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên địa điểm (Name)
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả (Description)
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md resize-y"
                ></textarea>
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI (SIDEBAR) --- */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <SidebarCard title="Hành động">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? "Đang cập nhật..." : "Cập nhật"}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDelete}
                className="w-full px-4 py-2 bg-white text-red-600 border border-red-500 rounded-md hover:bg-red-50 disabled:bg-gray-100"
              >
                Xóa địa điểm
              </button>
            </SidebarCard>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PageLocationEdit;